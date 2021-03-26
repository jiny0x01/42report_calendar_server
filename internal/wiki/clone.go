package wiki

import (
	"code.gitea.io/sdk/gitea"
	"github.com/go-git/go-git/v5"
	"log"
	"os"
	"strings"
)

const wikiRepoPath = "../../web/wiki/"

func ClearRepo(intraID string) {
	os.RemoveAll(wikiRepoPath + intraID)
}

func CloneWiki(intraID, repoURL string) bool {
	if _, err := os.Stat(wikiRepoPath + intraID); os.IsExist(err) {
		log.Printf("Alrady exist [%v] repo", intraID)
		return true
	}

	_, err := git.PlainClone(wikiRepoPath+intraID, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})

	CheckIfError(err)
	return true
}

func PullWiki(intraID string) bool {
	r, err := git.PlainOpen(wikiRepoPath + intraID)
	CheckIfError(err)
	if err != nil {
		log.Fatalln(err)
		return false
	}
	// Todo Implement

	return true
}

func AppendRepoSuffix(repoURL string) string {
	return strings.Replace(repoURL, "report", "report.wiki", 1)
}

func SearchPublicRepoRepository(intraID string) bool {
	url := "http://git.innovationacademy.kr:3000" // API base URL
	client, err := gitea.NewClient(url)
	if err != nil {
		log.Println(err)
	}
	repo, res, err := client.GetRepo(intraID, "report")
	if res.StatusCode == 200 && err != nil {
		log.Fatal("Fail to search report")
		return false
	}
	log.Printf("repo ID: %v\n", repo.ID)
	log.Printf("repo Owner: %v\n", repo.Owner.UserName)
	log.Printf("repo private: %v\n", repo.Private)
	log.Printf("repo HasWiki: %v\n", repo.HasWiki)
	log.Printf("repo cloneURL: %v\n", repo.CloneURL)
	wikiRepo := AppendRepoSuffix(repo.CloneURL)
	log.Printf("repo cloneURL: %v\n", wikiRepo)

	CloneWiki(repo.Owner.UserName, wikiRepo)
	return true
}
