<?php

require_once __DIR__ . '/../app/config/database.php';

try {
    $db = Database::connect();
    $db->beginTransaction();

    // 1. Khoa
    $db->exec("INSERT OR IGNORE INTO khoa (id, ma_khoa, ten_khoa) VALUES
        (1, 'CNTT', 'Công nghệ Thông tin'),
        (2, 'KT', 'Kinh tế & Quản trị'),
        (3, 'NN', 'Ngoại ngữ')
    ");

    // 2. Chuyên ngành
    $db->exec("INSERT OR IGNORE INTO chuyen_nganh (id, ma_chuyen_nganh, ten_chuyen_nganh, khoa_id) VALUES
        (1, 'KTPM', 'Kỹ thuật phần mềm', 1),
        (2, 'HTTT', 'Hệ thống thông tin', 1),
        (3, 'QTKD', 'Quản trị kinh doanh', 2)
    ");

    // 3. Chương trình đào tạo
    $db->exec("INSERT OR IGNORE INTO chuong_trinh_dao_tao (id, ma_chuong_trinh, ten_chuong_trinh, thoi_gian_dao_tao, chuyen_nganh_id) VALUES
        (1, 'CTDT-KTPM', 'Chương trình Kỹ thuật phần mềm', '4 năm', 1),
        (2, 'CTDT-HTTT', 'Chương trình Hệ thống thông tin', '4 năm', 2),
        (3, 'CTDT-QTKD', 'Chương trình Quản trị kinh doanh', '4 năm', 3)
    ");

    // 4. Lớp sinh viên
    $db->exec("INSERT OR IGNORE INTO lop_sinh_vien (id, ma_lop, ten_lop, khoa_hoc, chuong_trinh_id) VALUES
        (1, 'KTPM2023', 'Kỹ thuật phần mềm Khóa 2023', '2023-2027', 1),
        (2, 'KTPM2024', 'Kỹ thuật phần mềm Khóa 2024', '2024-2028', 1),
        (3, 'HTTT2023', 'Hệ thống thông tin Khóa 2023', '2023-2027', 2)
    ");

    // Cập nhật lớp sinh hoạt và vai trò cho tài khoản demo
    $db->exec("UPDATE users SET lop_sinh_vien_id = 1, vai_tro = 'sinh_vien' WHERE ma_dinh_danh = 'studentaccount1'");
    $db->exec("UPDATE users SET khoa_id = 1, vai_tro = 'giang_vien' WHERE ma_dinh_danh = 'lectureraccount1'");
    $db->exec("UPDATE users SET vai_tro = 'admin' WHERE ma_dinh_danh = 'adminaccount1'");

    // 5. Môn học (dữ liệu demo tối giản: 1 môn học)
    $db->exec("INSERT OR IGNORE INTO mon_hoc (id, ma_mon_hoc, ten_mon_hoc, so_tin_chi, so_tiet, mo_ta) VALUES
        (1, 'CS101', 'Nhập môn lập trình', 3, 45, 'Nguyên lý lập trình C/C++')
    ");

    // 6. Chi tiết chương trình đào tạo (Môn bắt buộc)
    $db->exec("INSERT OR IGNORE INTO chi_tiet_chuong_trinh_dao_tao (id, chuong_trinh_id, mon_hoc_id, hoc_ky, nam_hoc) VALUES
        (1, 1, 1, 1, 1)
    ");

    // 7. Nhóm tự chọn (RULE-02, RULE-03, RULE-04, RULE-06, RULE-07)
    $db->exec("INSERT OR IGNORE INTO nhom_tu_chon (id, ma_nhom, ten_nhom, chuong_trinh_id, so_tin_chi_toi_thieu) VALUES
        (1, 'NTC-A', 'Nhóm tự chọn A (Cơ sở mở rộng)', 1, 6),
        (2, 'NTC-B', 'Nhóm tự chọn B (Chuyên ngành phát triển)', 1, 9),
        (3, 'NTC-C', 'Nhóm tự chọn C (Nâng cao & Ứng dụng)', 1, 9)
    ");

    // 8. Chi tiết nhóm tự chọn: không seed môn nào (chỉ giữ 1 môn học demo)

    // 9. Lớp học phần
    // Lấy giảng viên id (lectureraccount1 id)
    $gvId = (int)$db->query("SELECT id FROM users WHERE ma_dinh_danh = 'lectureraccount1'")->fetchColumn();
    if (!$gvId) $gvId = 2;

    $db->exec("INSERT OR IGNORE INTO lop_hoc_phan (id, ma_lop_hoc_phan, mon_hoc_id, giang_vien_user_id, hoc_ky, nam_hoc, si_so_toi_da, phong_hoc, trang_thai) VALUES
        (1, 'CS101-HK1-2026', 1, $gvId, 1, '2026-2027', 40, 'A101', 'Đang mở')
    ");

    // Dữ liệu mẫu: thời gian đăng ký HK1 2026-2027 (RULE-08) cho các lớp demo chưa thiết lập
    $db->exec("UPDATE lop_hoc_phan
        SET thoi_gian_mo_dang_ky = '2026-08-15 00:00:00', thoi_gian_dong_dang_ky = '2026-11-30 23:59:59'
        WHERE hoc_ky = 1 AND nam_hoc = '2026-2027' AND thoi_gian_mo_dang_ky IS NULL");
    $db->exec("UPDATE lop_hoc_phan
        SET thoi_gian_mo_dang_ky = '2026-01-01 00:00:00', thoi_gian_dong_dang_ky = '2026-01-20 23:59:59'
        WHERE hoc_ky = 2 AND nam_hoc = '2025-2026' AND thoi_gian_mo_dang_ky IS NULL");

    // 10. Lịch học
    $db->exec("INSERT OR IGNORE INTO lich_hoc (id, lop_hoc_phan_id, thu, tiet_bat_dau, tiet_ket_thuc, ngay_bat_dau, ngay_ket_thuc) VALUES
        (1, 1, 2, 1, 3, '2026-09-07', '2026-12-25'),
        (2, 1, 4, 4, 5, '2026-09-07', '2026-12-25')
    ");

    // 11. Sinh viên demo đã đăng ký sẵn lớp học phần CS101-HK1-2026
    $db->exec("INSERT INTO dang_ky_hoc_phan (sinh_vien_user_id, lop_hoc_phan_id, ngay_dang_ky, thoi_gian_mo_dang_ky, thoi_gian_dong_dang_ky, trang_thai)
        SELECT u.id, 1, '" . (new DateTime('now', new DateTimeZone('Asia/Ho_Chi_Minh')))->format('c') . "', lhp.thoi_gian_mo_dang_ky, lhp.thoi_gian_dong_dang_ky, 'Đã đăng ký'
        FROM users u, lop_hoc_phan lhp
        WHERE u.ma_dinh_danh = 'studentaccount1' AND lhp.id = 1
          AND NOT EXISTS (SELECT 1 FROM dang_ky_hoc_phan dk WHERE dk.sinh_vien_user_id = u.id AND dk.lop_hoc_phan_id = 1)
    ");

    $db->commit();
    echo "Seed academic data thanh cong!\n";
} catch (Throwable $e) {
    if (isset($db) && $db->inTransaction()) {
        $db->rollBack();
    }
    echo "Loi: " . $e->getMessage() . "\n";
}
