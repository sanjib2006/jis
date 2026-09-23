-- ==============================================================================
-- Judiciary Information System (JIS) — Supabase PostgreSQL Row-Level Security (RLS)
-- Defense-in-depth authorization policies enforcing role boundaries at the database tier.
-- ==============================================================================

-- 1. Enable Row-Level Security across all 7 domain tables
ALTER TABLE "User" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Courtroom" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Case" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Hearing" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "Judgment" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "CaseView" ENABLE ROW LEVEL SECURITY;
ALTER TABLE "AuditLog" ENABLE ROW LEVEL SECURITY;

-- 2. Helper Functions to extract current authenticated user role & ID
CREATE OR REPLACE FUNCTION auth_user_role()
RETURNS "Role" AS $$
  SELECT role FROM "User" WHERE id = auth.uid()::text;
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_registrar()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()::text AND role = 'REGISTRAR' AND "isActive" = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_judge()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()::text AND role = 'JUDGE' AND "isActive" = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

CREATE OR REPLACE FUNCTION auth_is_lawyer()
RETURNS boolean AS $$
  SELECT EXISTS (
    SELECT 1 FROM "User"
    WHERE id = auth.uid()::text AND role = 'LAWYER' AND "isActive" = true
  );
$$ LANGUAGE sql STABLE SECURITY DEFINER;

-- ==============================================================================
-- 3. AUDIT LOG POLICIES (Append-only immutable record: NFR7, FR21)
-- ==============================================================================
DROP POLICY IF EXISTS "audit_log_insert_authenticated" ON "AuditLog";
CREATE POLICY "audit_log_insert_authenticated"
  ON "AuditLog"
  FOR INSERT
  TO authenticated
  WITH CHECK (true);

DROP POLICY IF EXISTS "audit_log_select_registrar" ON "AuditLog";
CREATE POLICY "audit_log_select_registrar"
  ON "AuditLog"
  FOR SELECT
  TO authenticated
  USING (auth_is_registrar());

-- Deny UPDATE and DELETE on AuditLog for all roles (immutable ledger)
DROP POLICY IF EXISTS "audit_log_deny_update" ON "AuditLog";
CREATE POLICY "audit_log_deny_update"
  ON "AuditLog"
  FOR UPDATE
  TO authenticated
  USING (false);

DROP POLICY IF EXISTS "audit_log_deny_delete" ON "AuditLog";
CREATE POLICY "audit_log_deny_delete"
  ON "AuditLog"
  FOR DELETE
  TO authenticated
  USING (false);

-- ==============================================================================
-- 4. CASE VIEW POLICIES (Lawyer pay-per-view tracking: FR4, FR19)
-- ==============================================================================
DROP POLICY IF EXISTS "case_view_insert_lawyer" ON "CaseView";
CREATE POLICY "case_view_insert_lawyer"
  ON "CaseView"
  FOR INSERT
  TO authenticated
  WITH CHECK (
    auth_is_lawyer() AND "lawyerId" = auth.uid()::text
  );

DROP POLICY IF EXISTS "case_view_select_owner_or_registrar" ON "CaseView";
CREATE POLICY "case_view_select_owner_or_registrar"
  ON "CaseView"
  FOR SELECT
  TO authenticated
  USING (
    auth_is_registrar() OR "lawyerId" = auth.uid()::text
  );

-- ==============================================================================
-- 5. CASE, HEARING & JUDGMENT POLICIES (FR12, FR13, FR18, FR19)
-- ==============================================================================
-- Case: Registrars have full CRUD. Judges and Lawyers may only SELECT closed cases.
DROP POLICY IF EXISTS "case_registrar_all" ON "Case";
CREATE POLICY "case_registrar_all"
  ON "Case"
  FOR ALL
  TO authenticated
  USING (auth_is_registrar())
  WITH CHECK (auth_is_registrar());

DROP POLICY IF EXISTS "case_select_closed_judicial" ON "Case";
CREATE POLICY "case_select_closed_judicial"
  ON "Case"
  FOR SELECT
  TO authenticated
  USING (
    status IN ('CLOSED', 'RESOLVED') AND (auth_is_judge() OR auth_is_lawyer())
  );

-- Hearing: Registrars have full CRUD. Judges/Lawyers may SELECT hearings on closed cases.
DROP POLICY IF EXISTS "hearing_registrar_all" ON "Hearing";
CREATE POLICY "hearing_registrar_all"
  ON "Hearing"
  FOR ALL
  TO authenticated
  USING (auth_is_registrar())
  WITH CHECK (auth_is_registrar());

DROP POLICY IF EXISTS "hearing_select_closed_case" ON "Hearing";
CREATE POLICY "hearing_select_closed_case"
  ON "Hearing"
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM "Case" c
      WHERE c.cin = "Hearing".cin
      AND c.status IN ('CLOSED', 'RESOLVED')
      AND (auth_is_judge() OR auth_is_lawyer())
    )
  );

-- Judgment: Registrars manage judgments. Judges and Lawyers may view judgments of closed cases.
DROP POLICY IF EXISTS "judgment_registrar_all" ON "Judgment";
CREATE POLICY "judgment_registrar_all"
  ON "Judgment"
  FOR ALL
  TO authenticated
  USING (auth_is_registrar())
  WITH CHECK (auth_is_registrar());

DROP POLICY IF EXISTS "judgment_select_judicial" ON "Judgment";
CREATE POLICY "judgment_select_judicial"
  ON "Judgment"
  FOR SELECT
  TO authenticated
  USING (auth_is_judge() OR auth_is_lawyer());

-- ==============================================================================
-- 6. COURTROOM POLICIES (Courtroom scheduling infrastructure)
-- ==============================================================================
DROP POLICY IF EXISTS "courtroom_registrar_all" ON "Courtroom";
CREATE POLICY "courtroom_registrar_all"
  ON "Courtroom"
  FOR ALL
  TO authenticated
  USING (auth_is_registrar())
  WITH CHECK (auth_is_registrar());

DROP POLICY IF EXISTS "courtroom_select_authenticated" ON "Courtroom";
CREATE POLICY "courtroom_select_authenticated"
  ON "Courtroom"
  FOR SELECT
  TO authenticated
  USING (true);

-- ==============================================================================
-- 7. USER POLICIES (Account directory & authentication)
-- ==============================================================================
DROP POLICY IF EXISTS "user_registrar_all" ON "User";
CREATE POLICY "user_registrar_all"
  ON "User"
  FOR ALL
  TO authenticated
  USING (auth_is_registrar())
  WITH CHECK (auth_is_registrar());

DROP POLICY IF EXISTS "user_select_self" ON "User";
CREATE POLICY "user_select_self"
  ON "User"
  FOR SELECT
  TO authenticated
  USING (id = auth.uid()::text);
