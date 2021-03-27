package wiki

import (
	"code.gitea.io/sdk/gitea"
	"github.com/go-git/go-git/v5"
	"log"
	"os"
	"strings"
)

const wikiRepoPath = "../../web/wiki/"

func ClearRepo(intraID string) error {
	err := os.RemoveAll(wikiRepoPath + intraID)
	if ok := CheckIfError(err); ok == false {
		return err
	}
	return nil
}

func CloneWiki(intraID, repoURL string) error {
	_, err := git.PlainClone(wikiRepoPath+intraID, false, &git.CloneOptions{
		URL: repoURL,
	})

	if ok := CheckIfError(err); ok == false {
		return err
	}
	return nil
}

func PullWiki(intraID string) error {
	log.Printf("%s wiki git pulling\n", intraID)
	r, err := git.PlainOpen(wikiRepoPath + intraID)
	if ok := CheckIfError(err); ok == false {
		return err
	}

	w, err := r.Worktree()
	if ok := CheckIfError(err); ok == false {
		return err
	}

	err = w.Pull(&git.PullOptions{RemoteName: "origin"})
	if ok := CheckIfError(err); ok == false {
		return err
	}
	return nil
}

func AppendRepoSuffix(repoURL string) string {
	return strings.Replace(repoURL, "report", "report.wiki", 1)
}

func SearchPublicRepoRepository(intraID string) (bool, error) {
	exist, err := os.Stat(wikiRepoPath + intraID)
	if exist != nil {
		log.Printf("%s local directory found. Try git pulling\n", intraID)
		PullWiki(intraID)
		return true, nil
	}

	url := "http://git.innovationacademy.kr:3000" // API base URL
	client, err := gitea.NewClient(url)
	if ok := CheckIfError(err); ok == false {
		return false, err
	}
	repo, res, err := client.GetRepo(intraID, "report")
	if ok := CheckIfError(err); ok == false {
		return false, err
	} else if res.StatusCode != 200 {
		log.Println("Fail to search report")
		return false, nil
	}
	/*
		log.Printf("res status: %d\n", res.StatusCode)
		log.Printf("repo ID: %v\n", repo.ID)
		log.Printf("repo Owner: %v\n", repo.Owner.UserName)
		log.Printf("repo private: %v\n", repo.Private)
		log.Printf("repo HasWiki: %v\n", repo.HasWiki)
		log.Printf("repo cloneURL: %v\n", repo.CloneURL)
	*/
	wikiRepo := AppendRepoSuffix(repo.CloneURL)
	//	log.Printf("repo cloneURL: %v\n", wikiRepo)
	err = CloneWiki(repo.Owner.UserName, wikiRepo)
	if ok := CheckIfError(err); ok == false {
		return false, err
	}
	return true, nil
}
