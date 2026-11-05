/* ================================================================
   KET-QUA.JS - Bảng điểm cá nhân (sinh viên) - dùng lại cho Tra cứu bảng điểm
   Font Awesome CDN Icons & Thiết kế Card hiện đại
   Quy chế điểm học kỳ & tích lũy, xử lý học lại / cải thiện
   ================================================================ */

(function ($) {
    'use strict';

    var KetQuaModule = {
        sinhVienId: null,   // tra cứu của quản trị viên / giảng viên (RULE-16.4); null = sinh viên xem của mình

        render: function () {
            var currentUser = App.getCurrentUser();
            if (!currentUser || currentUser.vai_tro !== 'sinh_vien') {
                $('#contentArea').html('<div class="alert alert-danger"><i class="fa-solid fa-triangle-exclamation"></i> Chức năng này chỉ dành cho tài khoản sinh viên</div>');
                return;
            }
            this.sinhVienId = null;
            this.renderInto($('#contentArea'), currentUser);
        },

        /** Dựng bảng điểm vào $box; sv = {ho_ten, ma_dinh_danh} */
        renderInto: function ($box, sv) {
            var moTa = this.sinhVienId
                ? 'Xem toàn bộ điểm số của sinh viên ' + App.escapeHtml(sv.ho_ten) + ' (' + App.escapeHtml(sv.ma_dinh_danh) + ').'
                : 'Xem toàn bộ điểm số của bạn.';
            var html =
                '<div class="kq-wrap">' +
                '  <div class="stats-grid-modern kq-stats" id="kqStats">' +
                this.statCard('Điểm TB tích lũy', '--', 'Theo toàn bộ môn đã có điểm') +
                this.statCard('Môn đã qua', '--', 'Các môn có tổng kết từ 4.0 trở lên') +
                this.statCard('Tín chỉ tích lũy', '--', 'Tổng tín chỉ các môn đã đạt') +
                this.statCard('Môn cao nhất', '--', '—') +
                '  </div>' +
                '  <div class="card bang-diem-card">' +
                '    <div class="card-body">' +
                '      <h3 class="bang-diem-title">Bảng điểm cá nhân</h3>' +
                '      <p class="bang-diem-desc">' + moTa + '</p>' +
                '      <div class="toolbar"><div class="toolbar-left">' +
                '        <select id="kqHocKy" class="filter-select"><option value="all">Tất cả học kỳ</option><option value="1">Học kỳ 1</option><option value="2">Học kỳ 2</option><option value="3">Học kỳ Hè</option></select>' +
                '        <select id="kqNamHoc" class="filter-select"><option value="all">Tất cả năm học</option></select>' +
                '      </div></div>' +
                '      <div class="bang-diem-scroll"><table class="bang-diem-table kq-table">' +
                '        <thead><tr>' +
                '          <th>STT</th><th>Mã MH</th><th>Nhóm/tổ môn học</th><th>Tên môn học</th><th>Số tín chỉ</th>' +
                '          <th>Chuyên cần</th><th>Giữa kỳ</th><th>Cuối kỳ</th><th>Điểm TK (10)</th><th>Điểm TK (4)</th><th>Điểm TK (Chữ)</th><th>Kết quả</th><th>Chi tiết</th>' +
                '        </tr></thead>' +
                '        <tbody id="kqTableBody"><tr><td colspan="13" class="bang-diem-empty">Đang tải...</td></tr></tbody>' +
                '      </table></div>' +
                '    </div>' +
                '  </div>' +
                '</div>';
            $box.html(html);
            var self = this;
            $box.off('click', '.btn-bd-chi-tiet').on('click', '.btn-bd-chi-tiet', function () {
                var d = (self.rows || [])[$(this).data('index')];
                if (d) self.showDetail(d);
            });
            $box.off('change', '#kqHocKy, #kqNamHoc').on('change', '#kqHocKy, #kqNamHoc', function () { self.loadGrades(); });
            App.fillTermSelects(null, '#kqNamHoc', { prefix: 'Năm học ' }, function () {
                $('#kqNamHoc').val('all');   // mặc định xem tất cả
            });
            this.loadGrades();
        },

        statCard: function (label, value, desc) {
            return '<div class="stat-modern-card">' +
                '<div class="stat-label">' + label + '</div>' +
                '<div class="stat-number">' + value + '</div>' +
                '<div class="stat-desc">' + desc + '</div></div>';
        },

        loadGrades: function () {
            var self = this;
            // RULE-16, 17: điểm và quy đổi do backend tính; lấy tất cả học kỳ
            var params = { hoc_ky: $('#kqHocKy').val() || 'all', nam_hoc: $('#kqNamHoc').val() || 'all' };
            if (this.sinhVienId) params.sinh_vien_id = this.sinhVienId;
            Api.get('/api/ketquahoctap/ket-qua', params)
                .done(function (res) { self.renderGrades(res); })
                .fail(Api.toastError);
        },

        /** Hộp thoại xem toàn bộ điểm của một môn */
        showDetail: function (d) {
            var diem = function (v, so) { return v != null && v !== '' ? Number(v).toFixed(so) : '—'; };
            var o = function (label, value) {
                return '<div class="detail-item"><span class="detail-label">' + label + '</span><span class="detail-value">' + value + '</span></div>';
            };
            var hk = (String(d.hoc_ky) === '3' ? 'Học kỳ Hè' : 'Học kỳ ' + d.hoc_ky) + ' - Năm học ' + App.escapeHtml(d.nam_hoc || '');
            var ketQua = d.cam_thi ? '<span class="badge badge-danger">Cấm thi</span>'
                : (d.ket_qua ? App.ketQuaBadge(d.ket_qua) : '<span class="text-gray">Chưa tổng kết</span>');
            var lanHoc = d.so_lan_hoc > 1
                ? 'Lần ' + d.lan_hoc + '/' + d.so_lan_hoc + (d.diem_he_10 != null ? (d.tinh_tich_luy ? ' · tính tích lũy' : ' · không tính tích lũy') : '')
                : 'Lần 1';
            var html =
                '<div class="modal-header">' +
                '  <h3>Chi tiết điểm - ' + App.escapeHtml(d.ten_mon_hoc) + '</h3>' +
                '  <button class="modal-close" onclick="ModalComponent.close()">&times;</button>' +
                '</div>' +
                '<div class="modal-body">' +
                '  <div class="detail-grid mb-3">' +
                o('Mã môn học', App.escapeHtml(d.ma_mon_hoc)) +
                o('Lớp học phần', App.escapeHtml(d.ma_lop_hoc_phan || '—')) +
                o('Học kỳ', hk) +
                o('Số tín chỉ', App.escapeHtml(d.so_tin_chi)) +
                o('Chuyên cần', diem(d.diem_chuyen_can, 1)) +
                o('Giữa kỳ', diem(d.diem_giua_ky, 1)) +
                o('Cuối kỳ', diem(d.diem_cuoi_ky, 1)) +
                o('Tổng kết (hệ 10)', diem(d.diem_he_10, 1)) +
                o('Hệ 4', diem(d.diem_he_4, 1)) +
                o('Điểm chữ', d.diem_chu ? App.diemChuBadge(d.diem_chu) : '—') +
                o('Kết quả', ketQua) +
                o('Lần học', lanHoc) +
                '  </div>' +
                (this.quyTac && typeof GiaiThichDiem !== 'undefined' ? '<div>' + GiaiThichDiem.hocPhan(d, this.quyTac) + '</div>' : '') +
                '</div>' +
                '<div class="modal-footer"><button class="btn btn-outline" onclick="ModalComponent.close()">Đóng</button></div>';
            ModalComponent.show(html, 'lg');
        },

        renderGrades: function (res) {
            var esc = App.escapeHtml;
            var rows = res.data || [];
            this.rows = rows;
            this.quyTac = res.quy_tac || null;
            var tl = res.tich_luy || {};
            var tbody = $('#kqTableBody').empty();
            var diem = function (v, so) { return v != null && v !== '' ? (so != null ? Number(v).toFixed(so) : String(Number(v))) : '—'; };
            var hocKy = function (d) {
                var nam = String(d.nam_hoc || '').split('-')[0];
                var hk = String(d.hoc_ky) === '3' ? 'Hè' : 'HK' + d.hoc_ky;
                return hk + (nam ? ' ' + nam : '');
            };

            // ---- 4 thẻ thống kê (số liệu tích lũy do backend tính) ----
            var coDiem = rows.filter(function (d) { return d.diem_he_10 != null && d.diem_he_10 !== ''; });
            // Thẻ thống kê luôn theo toàn khóa (danh sách môn tính tích lũy do backend chọn, RULE-18.11),
            // không phụ thuộc bộ lọc học kỳ
            var monTL = tl.mon || [];
            var soMonDat = monTL.filter(function (m) { return m.ket_qua === 'Đạt'; }).length;
            var cao = monTL.filter(function (m) { return m.diem_he_10 != null; })
                .sort(function (a, b) { return Number(b.diem_he_10) - Number(a.diem_he_10); })[0];
            $('#kqStats').html(
                this.statCard('Điểm TB tích lũy', tl.dtb_he_10 != null ? String(Number(Number(tl.dtb_he_10).toFixed(2))) : '--',
                    tl.dtb_he_4 != null ? 'Hệ 4: ' + Number(tl.dtb_he_4).toFixed(2) + ' · theo toàn bộ môn đã có điểm' : 'Theo toàn bộ môn đã có điểm') +
                this.statCard('Môn đã qua', soMonDat, 'Các môn có tổng kết từ 4.0 trở lên') +
                this.statCard('Tín chỉ tích lũy', tl.so_tin_chi_tich_luy || 0, 'Tổng tín chỉ các môn đã đạt') +
                this.statCard('Môn cao nhất', cao ? esc(cao.diem_chu || diem(cao.diem_he_10, 1)) : '--', cao ? esc(cao.ten_mon_hoc) : 'Chưa có điểm'));

            // UC016 luồng 3a: chưa có môn nào có điểm thì hiển thị bảng trống
            if (coDiem.length === 0) {
                tbody.html('<tr><td colspan="13" class="bang-diem-empty">Chưa có môn học nào có điểm</td></tr>');
                return;
            }

            // ---- Bảng điểm nhóm theo học kỳ ----
            var tongKet = {};
            (res.theo_hoc_ky || []).forEach(function (t) { tongKet[t.nam_hoc + '|' + t.hoc_ky] = t; });
            var nhom = [], map = {};
            rows.forEach(function (d, i) {
                var k = d.nam_hoc + '|' + d.hoc_ky;
                if (!map[k]) { map[k] = { key: k, d: d, items: [] }; nhom.push(map[k]); }
                map[k].items.push(i);
            });

            var html = '';
            nhom.forEach(function (g) {
                html += '<tr class="kq-hk-row"><td colspan="13">' + esc(hocKy(g.d)) + '</td></tr>';
                g.items.forEach(function (i, stt) {
                    var d = rows[i];
                    var ketQua = d.cam_thi ? '<span class="kq-badge kq-badge-khong">Cấm thi</span>'
                        : d.ket_qua === 'Đạt' ? '<span class="kq-badge kq-badge-dat">Đạt</span>'
                        : d.ket_qua ? '<span class="kq-badge kq-badge-khong">Không đạt</span>'
                        : '<span class="kq-badge kq-badge-cho">Chưa tổng kết</span>';
                    html +=
                        '<tr>' +
                        '<td>' + (stt + 1) + '</td>' +
                        '<td>' + esc(d.ma_mon_hoc) + '</td>' +
                        '<td>' + esc(d.ma_lop_hoc_phan || '—') + '</td>' +
                        '<td>' + esc(d.ten_mon_hoc) + '</td>' +
                        '<td>' + esc(d.so_tin_chi) + '</td>' +
                        '<td>' + diem(d.diem_chuyen_can) + '</td>' +
                        '<td>' + diem(d.diem_giua_ky) + '</td>' +
                        '<td>' + diem(d.diem_cuoi_ky) + '</td>' +
                        '<td>' + diem(d.diem_he_10, 1) + '</td>' +
                        '<td>' + diem(d.diem_he_4, 1) + '</td>' +
                        '<td>' + (d.diem_chu ? '<span class="bd-chu bd-chu-' + esc(String(d.diem_chu).charAt(0)) + '">' + esc(d.diem_chu) + '</span>' : '—') + '</td>' +
                        '<td>' + ketQua + '</td>' +
                        '<td><button class="btn-kq-icon btn-bd-chi-tiet" data-index="' + i + '" title="Xem chi tiết"><i class="fa-solid fa-table-list"></i></button></td>' +
                        '</tr>';
                });
                var t = tongKet[g.key];
                if (t) {
                    html += '<tr class="kq-sum-row">' +
                        '<td colspan="5">Tổng kết học kỳ</td>' +
                        '<td colspan="3">Tín chỉ đạt: ' + (t.so_tin_chi_dat || 0) + '/' + (t.so_tin_chi_dang_ky || 0) + '</td>' +
                        '<td>TB (10): ' + diem(t.dtb_he_10, 2) + '</td>' +
                        '<td>TB (4): ' + diem(t.dtb_he_4, 2) + '</td>' +
                        '<td colspan="3">Xếp loại: ' + esc(t.phan_loai || '—') + '</td>' +
                        '</tr>';
                }
            });
            tbody.html(html);
        }
    };

    window.KetQuaModule = KetQuaModule;
    App.registerModule('ket-qua', KetQuaModule);
})(jQuery);
