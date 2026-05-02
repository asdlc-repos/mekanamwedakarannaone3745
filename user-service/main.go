package main

import (
	"encoding/json"
	"log"
	"net/http"
	"strings"
)

type User struct {
	ID        string  `json:"id"`
	Name      string  `json:"name"`
	Email     string  `json:"email"`
	ManagerID *string `json:"managerId"`
	IsManager bool    `json:"isManager"`
}

var users = map[string]User{}

func init() {
	mgr1ID := "m1"
	mgr2ID := "m2"

	seed := []User{
		{ID: "m1", Name: "Alice Johnson", Email: "alice@example.com", ManagerID: nil, IsManager: true},
		{ID: "m2", Name: "Bob Smith", Email: "bob@example.com", ManagerID: nil, IsManager: true},
		{ID: "e1", Name: "Carol White", Email: "carol@example.com", ManagerID: &mgr1ID, IsManager: false},
		{ID: "e2", Name: "David Brown", Email: "david@example.com", ManagerID: &mgr1ID, IsManager: false},
		{ID: "e3", Name: "Eve Davis", Email: "eve@example.com", ManagerID: &mgr2ID, IsManager: false},
		{ID: "e4", Name: "Frank Miller", Email: "frank@example.com", ManagerID: &mgr2ID, IsManager: false},
		{ID: "e5", Name: "Grace Wilson", Email: "grace@example.com", ManagerID: &mgr1ID, IsManager: false},
	}
	for _, u := range seed {
		users[u.ID] = u
	}
}

func loggingMiddleware(next http.Handler) http.Handler {
	return http.HandlerFunc(func(w http.ResponseWriter, r *http.Request) {
		log.Printf("%s %s", r.Method, r.URL.Path)
		next.ServeHTTP(w, r)
	})
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func healthHandler(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func userHandler(w http.ResponseWriter, r *http.Request) {
	// Path: /users/{userId}
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.NotFound(w, r)
		return
	}
	userID := parts[1]
	u, ok := users[userID]
	if !ok {
		http.NotFound(w, r)
		return
	}
	writeJSON(w, http.StatusOK, u)
}

func managerHandler(w http.ResponseWriter, r *http.Request) {
	// Path: /users/{userId}/manager
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.NotFound(w, r)
		return
	}
	userID := parts[1]
	u, ok := users[userID]
	if !ok {
		http.NotFound(w, r)
		return
	}
	if u.ManagerID == nil {
		http.NotFound(w, r)
		return
	}
	mgr, ok := users[*u.ManagerID]
	if !ok {
		http.NotFound(w, r)
		return
	}
	writeJSON(w, http.StatusOK, mgr)
}

func reportsHandler(w http.ResponseWriter, r *http.Request) {
	// Path: /users/{userId}/reports
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	if len(parts) < 2 {
		http.NotFound(w, r)
		return
	}
	userID := parts[1]
	if _, ok := users[userID]; !ok {
		http.NotFound(w, r)
		return
	}
	reports := []User{}
	for _, u := range users {
		if u.ManagerID != nil && *u.ManagerID == userID {
			reports = append(reports, u)
		}
	}
	writeJSON(w, http.StatusOK, reports)
}

func usersRouter(w http.ResponseWriter, r *http.Request) {
	parts := strings.Split(strings.Trim(r.URL.Path, "/"), "/")
	// parts[0] == "users"
	switch {
	case len(parts) == 2:
		userHandler(w, r)
	case len(parts) == 3 && parts[2] == "manager":
		managerHandler(w, r)
	case len(parts) == 3 && parts[2] == "reports":
		reportsHandler(w, r)
	default:
		http.NotFound(w, r)
	}
}

func main() {
	mux := http.NewServeMux()
	mux.HandleFunc("/health", healthHandler)
	mux.HandleFunc("/users/", usersRouter)

	handler := loggingMiddleware(mux)
	log.Println("user-service listening on :9090")
	if err := http.ListenAndServe(":9090", handler); err != nil {
		log.Fatal(err)
	}
}
