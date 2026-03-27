# Prompt: Triển khai Form (Frontend Implement)

Dùng prompt này khi **đã có kế hoạch** (theo `form.plan.promt.md`) và muốn triển khai code thực tế cho một form trong FE.

---

## Nguyên tắc bắt buộc

1. **Tái sử dụng** UI primitives trong `src/components/ui/*` (button/input/label...).
2. **Tách API call** ra `src/services/api/*` dùng `axiosClient`.
3. **Không thêm dependency mới** cho form nếu không thật sự cần (ưu tiên controlled inputs + validate thủ công).
4. **UX bắt buộc**:
   - disable submit khi invalid/loading
   - show field-level error rõ ràng
   - show form-level error khi API fail

---

## Output mong muốn (tối thiểu)

- `src/pages/<PageName>.jsx` (hoặc cập nhật page hiện có)
- `src/components/forms/<FormName>Form.jsx` (nếu form có thể tái dùng; nếu chỉ dùng 1 nơi có thể đặt ngay trong page)
- `src/services/api/<resource>Api.js` (hàm gọi API)
- `src/components/ui/input.jsx` + `src/components/ui/label.jsx` (nếu chưa có trong dự án)

---

## Template validate tối thiểu (gợi ý)

- required: `trim().length > 0`
- email: `/^[^\s@]+@[^\s@]+\.[^\s@]+$/`
- password: min 6/8 ký tự (tuỳ requirement)

---

## Chuẩn xử lý API error

Khi catch lỗi axios:
- Nếu có `error.response?.data?.message` → show lên form-level error
- Nếu backend trả `fields` (ví dụ `{ fields: { email: "..." } }`) → map vào field errors
- Nếu network/timeout → show: "Không thể kết nối server. Vui lòng thử lại."

---

## Cách gọi prompt ngắn (copy-paste)

> Implement form `<FormName>` cho page `<PageName>` theo kế hoạch. Tạo/cập nhật UI bằng các component `src/components/ui/*`, tách API call vào `src/services/api/<resource>Api.js` dùng `axiosClient`, validate tối thiểu client-side, có loading + field errors + form error, và đảm bảo `npm run lint` pass.

