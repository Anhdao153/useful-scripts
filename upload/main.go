package main

import (
	"context"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/exec"
	"path/filepath"
	"strings"
	"time"

	"golang.org/x/oauth2"
	"golang.org/x/oauth2/google"
	"google.golang.org/api/drive/v3"
	"google.golang.org/api/option"
)

func saveToken(path string, token *oauth2.Token) {
	fmt.Printf("Saving credential file to: %s\n", path)
	f, err := os.OpenFile(path, os.O_RDWR|os.O_CREATE, 0600)
	if err != nil {
		log.Fatalf("Unable to cache oauth token: %v", err)
	}
	defer f.Close()
	err = json.NewEncoder(f).Encode(&token)
	if err != nil {
		log.Fatalf("Unable to encode token to JSON: %v", err)
	}
}

func getTokenFromWeb(config *oauth2.Config) *oauth2.Token {
	authURL := config.AuthCodeURL("state-token", oauth2.AccessTypeOffline)
	fmt.Printf("Go to the following link in your browser then type the "+
		"authorization code: \n%v\n", authURL)

	var authCode string
	if _, err := fmt.Scan(&authCode); err != nil {
		log.Fatalf("Unable to read authorization code %v", err)
	}

	tok, err := config.Exchange(context.TODO(), authCode)
	if err != nil {
		log.Fatalf("Unable to retrieve token from web %v", err)
	}
	return tok
}

func tokenFromFile(file string) (*oauth2.Token, error) {
	f, err := os.Open(file)
	if err != nil {
		return nil, err
	}
	defer f.Close()
	tok := &oauth2.Token{}
	err = json.NewDecoder(f).Decode(tok)
	return tok, err
}

func getClient(config *oauth2.Config) *http.Client {
	// The file token.json stores the user's access and refresh tokens, and is
	// created automatically when the authorization flow completes for the first
	// time.
	tokFile := "./token.json"
	if tokFile == "" {
		tokFile = os.Getenv("TOKEN_CREDENTIALS")
	}
	tok, err := tokenFromFile(tokFile)
	if err != nil {
		tok = getTokenFromWeb(config)
		saveToken(tokFile, tok)
	}
	return config.Client(context.Background(), tok)
}

func uploadFolder(service *drive.Service, folderPath, parentFolderID string) (*drive.File, error) {
	// Kiểm tra xem folderPath có phải là một thư mục không
	fileInfo, err := os.Stat(folderPath)
	if err != nil {
		return nil, err
	}
	if !fileInfo.IsDir() {
		return nil, fmt.Errorf("%s is not a directory", folderPath)
	}

	// Lấy tên thư mục cần tải lên
	folderName := filepath.Base(folderPath)

	// Tạo metadata cho thư mục
	folderMetadata := &drive.File{
		Name:     folderName,
		Parents:  []string{parentFolderID},
		MimeType: "application/vnd.google-apps.folder",
	}

	// Tạo thư mục trên Google Drive
	folder, err := service.Files.Create(folderMetadata).Do()
	if err != nil {
		return nil, fmt.Errorf("unable to create folder: %v", err)
	}

	// Lặp qua tất cả các tệp trong thư mục và tải lên
	filepath.Walk(folderPath, func(path string, info os.FileInfo, err error) error {
		if err != nil {
			return err
		}
		if !info.IsDir() {
			// Tạo metadata cho file
			fileMetadata := &drive.File{
				Name:    info.Name(),
				Parents: []string{folder.Id},
			}

			// Mở file
			file, err := os.Open(path)
			if err != nil {
				return err
			}
			defer file.Close()

			// Tải file lên
			_, err = service.Files.Create(fileMetadata).Media(file).Do()
			if err != nil {
				return err
			}
		}
		return nil
	})

	return folder, nil
}

func main() {
	// Load client secret from environment variable
	creds := os.Getenv("GDRIVE_CREDENTIALS_JSON")
	if creds == "" {
		log.Fatal("GDRIVE_CREDENTIALS_JSON not set")
	}

	// creds, err := os.ReadFile("./credentials.json")
	// if err != nil {
	// 	log.Fatalf("Unable to read client secret file: %v", err)
	// }

	ctx := context.Background()
	config, err := google.ConfigFromJSON(([]byte(creds)), drive.DriveScope)
	if err != nil {
		log.Fatalf("Unable to parse client secret file to config: %v", err)
	}
	client := getClient(config)
	srv, err := drive.NewService(ctx, option.WithHTTPClient(client))
	if err != nil {
		log.Fatalf("Unable to retrieve Drive client: %v", err)
	}

	current_time := time.Now().Format("2006-January-02")
	folderPath := strings.Join([]string{"../github", current_time}, "/")
	fmt.Println(current_time)
	fmt.Println(folderPath)

	//action command
	repos := []string{"adima-web-user", "adima-api", "acbank-web-admin", "adima-web-admin"}
	for _, repo := range repos {
		// Gọi lệnh để chạy function của Node.js với tên repository hiện tại
		cmd := exec.Command("node", "../github/count-PR-comments.js", repo, current_time)

		// Thực thi lệnh và kiểm tra lỗi
		err := cmd.Run()
		if err != nil {
			fmt.Printf("Error executing command for repo %s: %v\n", repo, err)
			continue
		}

		// In ra thông báo thành công
		fmt.Printf("Function executed successfully for repo %s\n", repo)
	}
	// upload folder
	// current_time := time.Now().Format("2006-January-02")
	// folderPath := strings.Join([]string{"../github", current_time}, "/")
	// Tải lên thư mục
	folderId := os.Getenv("FOLDER_ID")
	folder, err := uploadFolder(srv, folderPath, folderId)
	if err != nil {
		log.Fatalf("Unable to upload folder: %v", err)
	}

	if err != nil {
		log.Fatalf("Unable to upload folder: %v", err)
	}

	log.Printf("Folder uploaded successfully. ID: %s", folder.Id)

}
