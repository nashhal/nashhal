from nashhal_ai.data import NewsRecord, validate_records


def test_valid_record_has_no_errors():
    record = NewsRecord("1", "Title", "Text", "Source", "2026-09-14T00:00:00Z")
    assert record.validate() == []


def test_empty_fields_are_rejected():
    record = NewsRecord("", "Title", "Text", "Source", "date")
    assert "id: empty" in record.validate()


def test_batch_validation_includes_row_number():
    record = NewsRecord("", "", "Text", "Source", "date")
    errors = validate_records([record])
    assert "row 0: id: empty" in errors
    assert "row 0: title: empty" in errors
