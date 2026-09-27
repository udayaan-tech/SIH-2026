package app

import (
	"database/sql"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/nyay-suraksha/backend/config"
)

// DashboardStats contains all aggregated counts for the operations dashboard
type DashboardStats struct {
	ActiveCases     int `json:"active_cases"`
	TotalDocuments  int `json:"total_documents"`
	EvidenceRecords int `json:"evidence_records"`
	PendingReviews  int `json:"pending_reviews"`
	AuditEvents     int `json:"audit_events"`
	SecurityAlerts  int `json:"security_alerts"`
}

// FeedEvent is a single enriched activity item for the dashboard live feed
type FeedEvent struct {
	ID         string    `json:"id"`
	Action     string    `json:"action"`
	ActorBadge string    `json:"actor_badge"`
	TargetType string    `json:"target_type"`
	Detail     string    `json:"detail"`
	Severity   string    `json:"severity"`
	CreatedAt  time.Time `json:"created_at"`
}

// DashboardHandler handles dashboard-specific endpoints
type DashboardHandler struct {
	db          *sql.DB
	cfg         *config.Config
	authHandler *AuthHandler
}

// NewDashboardHandler creates a new DashboardHandler
func NewDashboardHandler(db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *DashboardHandler {
	return &DashboardHandler{db: db, cfg: cfg, authHandler: authHandler}
}

// GetStats returns real-time aggregated statistics for the dashboard.
// GET /api/v1/dashboard/stats
// RBAC: Any authenticated officer; counts are scoped by role.
func (h *DashboardHandler) GetStats(c *gin.Context) {
	callerID := fmt.Sprintf("%v", c.MustGet("user_id"))
	callerRole := fmt.Sprintf("%v", c.MustGet("role"))
	badgeID := fmt.Sprintf("%v", c.MustGet("badge_id"))

	stats := DashboardStats{}
	isElevated := callerRole == RoleAdmin || callerRole == RoleProsecutor || callerRole == RoleJudge || callerRole == RoleFSL

	// 1. Active Cases
	if isElevated {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM cases WHERE status = $1`, CaseStatusActive).Scan(&stats.ActiveCases)
	} else {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM cases WHERE status = $1 AND io_id = $2`, CaseStatusActive, callerID).Scan(&stats.ActiveCases)
	}

	// 2. Total Documents
	if isElevated {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM documents`).Scan(&stats.TotalDocuments)
	} else {
		_ = h.db.QueryRow(`
			SELECT COUNT(d.id) FROM documents d
			JOIN cases c ON c.id = d.case_id
			WHERE c.io_id = $1`, callerID).Scan(&stats.TotalDocuments)
	}

	// 3. Evidence Records (classified documents)
	if isElevated {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM documents WHERE classification IN ('SECRET','TOP_SECRET','RESTRICTED','CONFIDENTIAL')`).Scan(&stats.EvidenceRecords)
	} else {
		_ = h.db.QueryRow(`
			SELECT COUNT(d.id) FROM documents d
			JOIN cases c ON c.id = d.case_id
			WHERE c.io_id = $1 AND d.classification IN ('SECRET','TOP_SECRET','RESTRICTED','CONFIDENTIAL')`, callerID).Scan(&stats.EvidenceRecords)
	}

	// 4. Pending Reviews (items in redaction/review queue)
	if isElevated {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM redaction_queue WHERE status = 'PENDING'`).Scan(&stats.PendingReviews)
	} else {
		_ = h.db.QueryRow(`
			SELECT COUNT(rq.id) FROM redaction_queue rq
			JOIN documents d ON d.id = rq.document_id
			JOIN cases c ON c.id = d.case_id
			WHERE c.io_id = $1 AND rq.status = 'PENDING'`, callerID).Scan(&stats.PendingReviews)
	}

	// 5. Audit Events
	if callerRole == RoleAdmin || callerRole == RoleJudge {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM audit_events`).Scan(&stats.AuditEvents)
	} else {
		_ = h.db.QueryRow(`SELECT COUNT(*) FROM audit_events WHERE actor_id::text = $1 OR actor_badge = $2`, callerID, badgeID).Scan(&stats.AuditEvents)
	}

	// 6. Security Alerts (last 7 days)
	sevenDaysAgo := time.Now().UTC().Add(-7 * 24 * time.Hour)
	_ = h.db.QueryRow(`
		SELECT COUNT(*) FROM audit_events
		WHERE action IN ('LOGIN_FAILED','MFA_FAILED','UNAUTHORIZED_ACCESS','BOLA_BLOCK','RATE_LIMIT_HIT')
		AND created_at >= $1`, sevenDaysAgo).Scan(&stats.SecurityAlerts)

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    stats,
		"error":   nil,
	})
}

// GetActivityFeed returns the last 10 audit events as a human-readable activity feed.
// GET /api/v1/dashboard/feed
func (h *DashboardHandler) GetActivityFeed(c *gin.Context) {
	callerID := fmt.Sprintf("%v", c.MustGet("user_id"))
	callerRole := fmt.Sprintf("%v", c.MustGet("role"))

	var rows *sql.Rows
	var err error

	if callerRole == RoleAdmin || callerRole == RoleJudge {
		rows, err = h.db.Query(`
			SELECT id, COALESCE(actor_badge, 'SYSTEM'), action,
			       COALESCE(target_type, ''), COALESCE(details::text, '{}'), created_at
			FROM audit_events
			ORDER BY created_at DESC
			LIMIT 10`)
	} else {
		rows, err = h.db.Query(`
			SELECT ae.id, COALESCE(ae.actor_badge, 'SYSTEM'), ae.action,
			       COALESCE(ae.target_type, ''), COALESCE(ae.details::text, '{}'), ae.created_at
			FROM audit_events ae
			WHERE ae.actor_id::text = $1
			   OR ae.target_id IN (SELECT id FROM cases WHERE io_id::text = $1)
			ORDER BY ae.created_at DESC
			LIMIT 10`, callerID)
	}

	if err != nil {
		log.Printf("[DashboardFeed] Query error: %v -- falling back to global feed", err)
		rows, err = h.db.Query(`
			SELECT id, COALESCE(actor_badge, 'SYSTEM'), action,
			       COALESCE(target_type, ''), COALESCE(details::text, '{}'), created_at
			FROM audit_events
			ORDER BY created_at DESC
			LIMIT 10`)
		if err != nil {
			c.JSON(http.StatusInternalServerError, gin.H{
				"success": false, "data": nil, "error": "Failed to fetch activity feed",
			})
			return
		}
	}
	defer rows.Close()

	feed := []FeedEvent{}
	for rows.Next() {
		var ev FeedEvent
		var detailsText string
		if err := rows.Scan(&ev.ID, &ev.ActorBadge, &ev.Action, &ev.TargetType, &detailsText, &ev.CreatedAt); err != nil {
			continue
		}
		ev.Detail = humanReadableAction(ev.Action)
		ev.Severity = severityForAction(ev.Action)
		feed = append(feed, ev)
	}

	c.JSON(http.StatusOK, gin.H{
		"success": true,
		"data":    gin.H{"feed": feed, "total": len(feed)},
		"error":   nil,
	})
}

// humanReadableAction converts an audit action code into a display string
func humanReadableAction(action string) string {
	m := map[string]string{
		"CASE_CREATED":        "New case registered in the system",
		"CASE_STATUS_UPDATED": "Case status updated",
		"DOCUMENT_UPLOADED":   "New evidence document uploaded",
		"DOCUMENT_VERIFIED":   "Document integrity verified (SHA-256)",
		"CUSTODY_TRANSFER":    "Physical evidence custody transferred",
		"LOGIN_SUCCESS":       "Officer authentication successful",
		"LOGIN_FAILED":        "Failed login attempt detected",
		"MFA_VERIFIED":        "MFA token successfully verified",
		"MFA_FAILED":          "MFA verification failed",
		"UNAUTHORIZED_ACCESS": "Unauthorized access attempt blocked",
		"BOLA_BLOCK":          "Cross-officer data access blocked (BOLA)",
		"RATE_LIMIT_HIT":      "Excessive request rate -- connection blocked",
		"REDACTION_APPROVED":  "Document redaction approved",
		"REDACTION_REJECTED":  "Document redaction rejected",
	}
	if msg, ok := m[action]; ok {
		return msg
	}
	return action
}

// severityForAction maps an audit action to a UI severity level
func severityForAction(action string) string {
	switch action {
	case "LOGIN_FAILED", "MFA_FAILED":
		return "WARNING"
	case "UNAUTHORIZED_ACCESS", "BOLA_BLOCK", "RATE_LIMIT_HIT":
		return "CRITICAL"
	default:
		return "INFO"
	}
}

// RegisterDashboardRoutes mounts dashboard endpoints onto the router
func RegisterDashboardRoutes(router *gin.Engine, db *sql.DB, cfg *config.Config, authHandler *AuthHandler) *DashboardHandler {
	handler := NewDashboardHandler(db, cfg, authHandler)

	dashGroup := router.Group("/api/v1/dashboard")
	dashGroup.Use(authHandler.AuthRequired())
	{
		dashGroup.GET("/stats", handler.GetStats)
		dashGroup.GET("/feed", handler.GetActivityFeed)
	}

	log.Println("Dashboard routes registered (/api/v1/dashboard/stats, /api/v1/dashboard/feed)")
	return handler
}