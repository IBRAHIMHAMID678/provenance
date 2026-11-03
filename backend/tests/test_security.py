from app.services.security_service import security_suite

def test_adversarial_security_suite():
    audit_results = security_suite.run_security_audit()
    assert len(audit_results) == 5
    for tc in audit_results:
        assert tc.passed is True
        assert len(tc.evidence_log) > 0

