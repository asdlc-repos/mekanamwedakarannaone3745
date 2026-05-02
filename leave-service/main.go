package main

import (
	"encoding/json"
	"fmt"
	"io"
	"log"
	"net/http"
	"os"
	"strings"
	"sync"
	"time"

	"github.com/google/uuid"
)

const defaultLeaveBalance = 20

var userServiceURL = "http://user-service:9090"

func init() {
	if v := os.Getenv("USER_SERVICE_URL"); v != "" {
		userServiceURL = strings.TrimRight(v, "/")
	}
}

// Models

type LeaveRequest struct {
	ID        string    `json:"id"`
	UserID    string    `json:"userId"`
	StartDate string    `json:"startDate"`
	EndDate   string    `json:"endDate"`
	Status    string    `json:"status"`
	CreatedAt time.Time `json:"createdAt"`
	UpdatedAt time.Time `json:"updatedAt"`
}

type LeaveBalance struct {
	UserID        string `json:"userId"`
	TotalDays     int    `json:"totalDays"`
	UsedDays      int    `json:"usedDays"`
	RemainingDays int    `json:"remainingDays"`
}

// Store

type Store struct {
	mu       sync.RWMutex
	requests map[string]*LeaveRequest
	balances map[string]*LeaveBalance
}

func NewStore() *Store {
	return &Store{
		requests: make(map[string]*LeaveRequest),
		balances: make(map[string]*LeaveBalance),
	}
}

func (s *Store) getBalance(userID string) *LeaveBalance {
	if b, ok := s.balances[userID]; ok {
		return b
	}
	b := &LeaveBalance{
		UserID:        userID,
		TotalDays:     defaultLeaveBalance,
		UsedDays:      0,
		RemainingDays: defaultLeaveBalance,
	}
	s.balances[userID] = b
	return b
}

// Helpers

func countDays(startDate, endDate string) (int, error) {
	const layout = "2006-01-02"
	start, err := time.Parse(layout, startDate)
	if err != nil {
		return 0, err
	}
	end, err := time.Parse(layout, endDate)
	if err != nil {
		return 0, err
	}
	days := int(end.Sub(start).Hours()/24) + 1
	return days, nil
}

func writeJSON(w http.ResponseWriter, status int, v any) {
	w.Header().Set("Content-Type", "application/json")
	w.WriteHeader(status)
	json.NewEncoder(w).Encode(v)
}

func writeError(w http.ResponseWriter, status int, msg string) {
	writeJSON(w, status, map[string]string{"error": msg})
}

// Handlers

type Server struct {
	store *Store
}

func (s *Server) ServeHTTP(w http.ResponseWriter, r *http.Request) {
	log.Printf("%s %s", r.Method, r.URL.Path)

	switch {
	case r.URL.Path == "/health" && r.Method == http.MethodGet:
		s.handleHealth(w, r)

	case r.URL.Path == "/leave-requests" && r.Method == http.MethodPost:
		s.handleCreateLeaveRequest(w, r)

	case r.URL.Path == "/leave-requests" && r.Method == http.MethodGet:
		s.handleListLeaveRequests(w, r)

	case strings.HasPrefix(r.URL.Path, "/leave-requests/") && r.Method == http.MethodGet:
		s.handleGetLeaveRequest(w, r)

	case strings.HasPrefix(r.URL.Path, "/leave-requests/") && r.Method == http.MethodPatch:
		s.handleUpdateLeaveRequest(w, r)

	case strings.HasPrefix(r.URL.Path, "/leave-balance/") && r.Method == http.MethodGet:
		s.handleGetLeaveBalance(w, r)

	default:
		writeError(w, http.StatusNotFound, "not found")
	}
}

func (s *Server) handleHealth(w http.ResponseWriter, r *http.Request) {
	writeJSON(w, http.StatusOK, map[string]string{"status": "ok"})
}

func (s *Server) handleCreateLeaveRequest(w http.ResponseWriter, r *http.Request) {
	var input struct {
		UserID    string `json:"userId"`
		StartDate string `json:"startDate"`
		EndDate   string `json:"endDate"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.UserID == "" || input.StartDate == "" || input.EndDate == "" {
		writeError(w, http.StatusBadRequest, "userId, startDate, and endDate are required")
		return
	}

	const layout = "2006-01-02"
	start, err := time.Parse(layout, input.StartDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid startDate format, expected YYYY-MM-DD")
		return
	}
	end, err := time.Parse(layout, input.EndDate)
	if err != nil {
		writeError(w, http.StatusBadRequest, "invalid endDate format, expected YYYY-MM-DD")
		return
	}
	if end.Before(start) {
		writeError(w, http.StatusBadRequest, "endDate must be >= startDate")
		return
	}

	now := time.Now().UTC()
	req := &LeaveRequest{
		ID:        uuid.New().String(),
		UserID:    input.UserID,
		StartDate: input.StartDate,
		EndDate:   input.EndDate,
		Status:    "pending",
		CreatedAt: now,
		UpdatedAt: now,
	}

	s.store.mu.Lock()
	s.store.requests[req.ID] = req
	// Ensure balance record is initialized
	s.store.getBalance(input.UserID)
	s.store.mu.Unlock()

	writeJSON(w, http.StatusCreated, req)
}

func (s *Server) handleListLeaveRequests(w http.ResponseWriter, r *http.Request) {
	userID := r.URL.Query().Get("userId")
	managerID := r.URL.Query().Get("managerId")

	var reportIDs map[string]bool

	if managerID != "" {
		ids, err := fetchReportIDs(managerID)
		if err != nil {
			log.Printf("error fetching reports for manager %s: %v", managerID, err)
			writeError(w, http.StatusInternalServerError, "failed to fetch manager reports")
			return
		}
		reportIDs = make(map[string]bool, len(ids))
		for _, id := range ids {
			reportIDs[id] = true
		}
	}

	s.store.mu.RLock()
	defer s.store.mu.RUnlock()

	result := []*LeaveRequest{}
	for _, req := range s.store.requests {
		if userID != "" && req.UserID != userID {
			continue
		}
		if managerID != "" {
			if !reportIDs[req.UserID] {
				continue
			}
			if req.Status != "pending" {
				continue
			}
		}
		result = append(result, req)
	}
	writeJSON(w, http.StatusOK, result)
}

func (s *Server) handleGetLeaveRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/leave-requests/")
	s.store.mu.RLock()
	req, ok := s.store.requests[id]
	s.store.mu.RUnlock()
	if !ok {
		writeError(w, http.StatusNotFound, "leave request not found")
		return
	}
	writeJSON(w, http.StatusOK, req)
}

func (s *Server) handleUpdateLeaveRequest(w http.ResponseWriter, r *http.Request) {
	id := strings.TrimPrefix(r.URL.Path, "/leave-requests/")

	var input struct {
		Status string `json:"status"`
	}
	if err := json.NewDecoder(r.Body).Decode(&input); err != nil {
		writeError(w, http.StatusBadRequest, "invalid JSON")
		return
	}
	if input.Status != "approved" && input.Status != "rejected" {
		writeError(w, http.StatusBadRequest, "status must be 'approved' or 'rejected'")
		return
	}

	s.store.mu.Lock()
	defer s.store.mu.Unlock()

	req, ok := s.store.requests[id]
	if !ok {
		writeError(w, http.StatusNotFound, "leave request not found")
		return
	}
	if req.Status != "pending" {
		writeError(w, http.StatusBadRequest, "only pending requests can be updated")
		return
	}

	if input.Status == "approved" {
		days, err := countDays(req.StartDate, req.EndDate)
		if err != nil {
			writeError(w, http.StatusBadRequest, "invalid date range in request")
			return
		}
		bal := s.store.getBalance(req.UserID)
		if bal.RemainingDays < days {
			writeError(w, http.StatusBadRequest, fmt.Sprintf("insufficient leave balance: need %d days, have %d", days, bal.RemainingDays))
			return
		}
		bal.UsedDays += days
		bal.RemainingDays -= days
	}

	req.Status = input.Status
	req.UpdatedAt = time.Now().UTC()
	writeJSON(w, http.StatusOK, req)
}

func (s *Server) handleGetLeaveBalance(w http.ResponseWriter, r *http.Request) {
	userID := strings.TrimPrefix(r.URL.Path, "/leave-balance/")
	if userID == "" {
		writeError(w, http.StatusNotFound, "user not found")
		return
	}

	s.store.mu.Lock()
	bal := s.store.getBalance(userID)
	s.store.mu.Unlock()

	writeJSON(w, http.StatusOK, bal)
}

// fetchReportIDs calls user-service to get direct reports of a manager.
func fetchReportIDs(managerID string) ([]string, error) {
	url := fmt.Sprintf("%s/users/%s/reports", userServiceURL, managerID)
	resp, err := http.Get(url)
	if err != nil {
		return nil, err
	}
	defer resp.Body.Close()

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		return nil, err
	}

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("user-service returned %d: %s", resp.StatusCode, body)
	}

	// Try array of objects with "id" field first, then plain string array
	var users []struct {
		ID string `json:"id"`
	}
	if err := json.Unmarshal(body, &users); err == nil && len(users) > 0 && users[0].ID != "" {
		ids := make([]string, len(users))
		for i, u := range users {
			ids[i] = u.ID
		}
		return ids, nil
	}

	var ids []string
	if err := json.Unmarshal(body, &ids); err != nil {
		return nil, fmt.Errorf("unexpected response format from user-service: %v", err)
	}
	return ids, nil
}

func main() {
	srv := &Server{store: NewStore()}
	port := "9090"
	log.Printf("leave-service listening on :%s", port)
	if err := http.ListenAndServe(":"+port, srv); err != nil {
		log.Fatal(err)
	}
}
