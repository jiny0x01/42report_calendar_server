package clone

import (
	"code.gitea.io/sdk/gitea"
	"fmt"
	"github.com/go-git/go-git/v5"
	"log"
	"os"
	"strings"
)

const wikiRepoPath = "../../web/wiki/"

func ClearRepo(intraID string) {
	os.RemoveAll(wikiRepoPath + intraID)
}

func CloneWiki(intraID, repoURL string) {
	if _, err := os.Stat(wikiRepoPath + intraID); os.IsExist(err) {
		log.Printf("Alrady exist [%v] repo", intraID)
		return
	}

	// wiki 내용이 업데이트를 확인해야함.
	_, err := git.PlainClone(wikiRepoPath+intraID, false, &git.CloneOptions{
		URL:      repoURL,
		Progress: os.Stdout,
	})

	if err != nil {
		log.Println(err)
	}
}

func AppendRepoSuffix(repoURL string) string {
	return strings.Replace(repoURL, "report", "report.wiki", 1)
}

func SearchUser(intraID string) bool {
	url := "http://git.innovationacademy.kr:3000" // API base UR
	client, err := gitea.NewClient(url)
	if err != nil {
		log.Println(err)
	}
	repo, res, err := client.GetRepo(intraID, "report")
	if res.StatusCode == 200 && err != nil {
		log.Fatal("Fail to search report")
		return false
	}
	fmt.Printf("repo ID: %v\n", repo.ID)
	fmt.Printf("repo Owner: %v\n", repo.Owner.UserName)
	fmt.Printf("repo private: %v\n", repo.Private)
	fmt.Printf("repo HasWiki: %v\n", repo.HasWiki)
	fmt.Printf("repo cloneURL: %v\n", repo.CloneURL)
	wikiRepo := AppendRepoSuffix(repo.CloneURL)
	fmt.Printf("repo cloneURL: %v\n", wikiRepo)

	CloneWiki(repo.Owner.UserName, wikiRepo)
	return true
}
