package wiki // todo change wiki to user

import (
	"net/rpc"
)

type Users []string

type ValidUsers struct {
	users Users
}

func CheckValid(users []string) ([]string, error) {
	client, err := rpc.Dial("tcp", "42report.today:8081")
	if err != nil {
		return nil, err
	}
	defer client.Close()

	vu := new([]string)
	err = client.Call("User.GetValid", users, vu)
	if err != nil {
		return nil, err
	}
	return *vu, nil
}
