# Hướng dẫn setup AWS trên máy (Windows) — IAM & AWS CLI từng bước

## Mục đích

Hướng dẫn **từng bước** để:

1. Tài khoản AWS có thể đăng nhập **AWS console**.
2. Tạo **IAM user** (cho developer / CI) có **Access key** dùng trên máy Windows.
3. Gắn **chính sách phân quyền (policy)** phù hợp (khuyến nghị: tối thiểu hóa quyền).
4. Cài **AWS CLI v2** và chạy `aws configure` trên máy.

Tài liệu này là **thao tác vận hành**; kiến năng nghiệp vụ WMS xem [Tích hợp AWS — cảnh báo tồn & async](./aws-low-stock-and-async.md).

---

## 0. Chuẩn bị

- Một **AWS account** (root không dùng cho thường nhật; chỉ dùng khi cấp hình tài khoản).
- Trình duyệt, quyền truy cập email/SMS để xác minh nếu cần.
- Quyết định **Region** làm việc (ví dụ `ap-southeast-1` — Singapore). Mọi tài nguyên (Lambda, DynamoDB, SES…) thường gắn với một region; ghi nhớ region để tránh “tạo ở region A mà CLI đang trỏ region B”.

---

## Bước 1 — Đăng nhập AWS Console

1. Mở trình duyệt, vào https://console.aws.amazon.com/
2. Đăng nhập bằng **IAM user** (ưu tiên) hoặc tài khoản được admin cấp.
3. Ở góc trên bên phải, chọn **Region** (ví dụ Singapore).

---

## Bước 2 — Vào dịch vụ IAM

1. Trên thanh tìm kiếm dịch vụ, gõ **IAM**.
2. Mở **IAM** → menu trái chọn **Users** (Người dùng).

---

## Bước 3 — Tạo IAM user mới (dùng cho máy dev)

1. Chọn **Create user**.
2. **User name**: ví dụ `wms-dev-yourname` (không dấu, không khoảng trắng linh tinh).
3. **Provide user access to the AWS Management Console** (tùy chọn):
   - Nếu chỉ cần **Access key** cho CLI/SDK và **không** cần đăng nhập web: có thể bỏ qua console password.
   - Nếu dev cần vào console: bật và cấu hình password theo policy tổ chức (khuyến nghị bật **MFA** sau khi tạo xong).
4. **Next**.

---

## Bước 4 — Gán quyền (phân quyền IAM)

Có hai hướng phổ biến.

### Cách A — Gán policy có sẵn (nhanh, kém an toàn, chỉ môi trường cá nhân / học tập)

1. Ở bước **Set permissions**, chọn **Attach policies directly**.
2. Tìm và chọn (ví dụ):
   - `AdministratorAccess` — **toàn quyền**, chỉ dùng khi bạn hiểu rủi ro.
   - Hoặc `PowerUserAccess` — gần full nhưng hạn chế một số thao tác IAM/User security.
3. **Next** → **Create user**.

**Khuyến nghị production / team:** không dùng Administrator cho user cá nhân; dùng Cách B.

### Cách B — Tạo custom policy (khuyến nghị)

1. Trong IAM, menu trái **Policies** → **Create policy** → tab **JSON**.
2. Dán JSON policy (ví dụ **khung** cho luồng WMS async: Lambda + log CloudWatch + DynamoDB + SES + SQS + Scheduler). **Thay** `ACCOUNT_ID`, `REGION`, tên bảng, tên queue, ARN Lambda… cho đúng môi trường.

```json
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Sid": "CloudWatchLogsForLambdaDev",
      "Effect": "Allow",
      "Action": [
        "logs:CreateLogGroup",
        "logs:CreateLogStream",
        "logs:PutLogEvents"
      ],
      "Resource": "arn:aws:logs:*:*:*"
    },
    {
      "Sid": "DynamoStockAlertTables",
      "Effect": "Allow",
      "Action": [
        "dynamodb:GetItem",
        "dynamodb:PutItem",
        "dynamodb:UpdateItem",
        "dynamodb:Query",
        "dynamodb:DescribeTable"
      ],
      "Resource": [
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/low_stock_alert_state",
        "arn:aws:dynamodb:REGION:ACCOUNT_ID:table/low_stock_alert_events"
      ]
    },
    {
      "Sid": "SESMinimalSend",
      "Effect": "Allow",
      "Action": [
        "ses:SendEmail",
        "ses:SendRawEmail"
      ],
      "Resource": "*"
    },
    {
      "Sid": "SQSQueuesScoped",
      "Effect": "Allow",
      "Action": [
        "sqs:SendMessage",
        "sqs:ReceiveMessage",
        "sqs:DeleteMessage",
        "sqs:GetQueueAttributes",
        "sqs:GetQueueUrl"
      ],
      "Resource": "arn:aws:sqs:REGION:ACCOUNT_ID:wms-low-stock-*"
    },
    {
      "Sid": "EventBridgeSchedulerInvokeLambda",
      "Effect": "Allow",
      "Action": [
        "scheduler:CreateSchedule",
        "scheduler:UpdateSchedule",
        "scheduler:DeleteSchedule",
        "scheduler:GetSchedule"
      ],
      "Resource": "arn:aws:scheduler:REGION:ACCOUNT_ID:schedule/default/*"
    },
    {
      "Sid": "PassRoleForSchedulerToLambda",
      "Effect": "Allow",
      "Action": "iam:PassRole",
      "Resource": "arn:aws:iam::ACCOUNT_ID:role/EventBridgeSchedulerExecutionRole",
      "Condition": {
        "StringEquals": {
          "iam:PassedToService": "scheduler.amazonaws.com"
        }
      }
    }
  ]
}
```

3. **Next** → đặt tên policy ví dụ `WmsAsyncIntegrationDev` → **Create policy**.
4. Quay lại **Users** → user vừa tạo → **Add permissions** → **Attach policies directly** → chọn `WmsAsyncPolicyDev`.

**Ghi chú:**

- Policy mẫu trên là **khung**: thực tế còn thiếu quyền tạo tài nguyên hạ tầng (Lambda, IAM role cho Lambda, SQS, DynamoDB, Scheduler, SES verify, v.v.). Nếu team dùng IaC, quyền deploy thường nằm ở role/pipeline riêng.
- **Lambda execution role** (role mà Lambda *chạy với*) **khác** IAM user trên máy: user dev có quyền *deploy*; Lambda có role chỉ `ses:SendEmail`, DynamoDB table ARN, v.v.

---

## (Nếu bạn dùng SST) Setup deploy bằng SST trên máy

SST chạy trên AWS credential của máy (AWS CLI profile). Bạn chỉ cần:

1. Có IAM user/role dùng để chạy `sst deploy`.
2. Cấu hình AWS credentials/profile đúng.
3. Chạy deploy từ thư mục project SST.

### 1) Cài Node.js và SST

- Cài Node.js LTS.
- Trong project, cài dependency theo repo (thường `npm i` hoặc `pnpm i`).
- Chạy SST bằng npm script hoặc `npx sst ...` (tùy cấu hình dự án).

### 2) Dùng AWS profile riêng cho SST (khuyến nghị)

Tạo profile bằng CLI:

```powershell
aws configure --profile wms-dev
```

Khi deploy, chọn profile bằng biến môi trường:

```powershell
$env:AWS_PROFILE="wms-dev"
npx sst deploy
```

Hoặc set region nếu cần:

```powershell
$env:AWS_PROFILE="wms-dev"
$env:AWS_REGION="ap-southeast-1"
npx sst deploy
```

### 3) IAM permission cho user/role chạy `sst deploy`

SST sẽ tạo/cập nhật nhiều tài nguyên (CloudFormation, IAM roles, Lambda, API Gateway, SQS, DynamoDB, EventBridge/Scheduler, CloudWatch Logs...). Vì vậy permission “tối thiểu tuyệt đối” rất khó chuẩn hóa nếu chưa chốt stack.

Khuyến nghị thực tế:

- **Dev account / sandbox**: dùng policy rộng kiểu `PowerUserAccess` + bổ sung các quyền cần thiết cho IAM (đặc biệt `iam:CreateRole`, `iam:AttachRolePolicy`, `iam:PassRole`) để SST tạo execution role.
- **CI/Prod**: tạo role deploy riêng, giới hạn theo prefix stack (tag/pattern), và review theo tài nguyên thực tế trong `sst.config.ts`.

Tối thiểu thường phải có nhóm quyền:

- `cloudformation:*` (hoặc tối thiểu các action create/update stack)
- `iam:*Role*` + `iam:PassRole` (để tạo/đính role cho Lambda)
- `lambda:*`
- `apigateway:*` / `execute-api:*` (nếu có API)
- `logs:*`
- `sqs:*`, `dynamodb:*`
- `events:*` hoặc `scheduler:*` (nếu dùng Scheduler)
- `ses:*` phần verify/domain + `ses:SendEmail` (tùy workflow)

Nếu bạn muốn mình viết policy **hẹp hơn**, mình cần biết stack SST của bạn dùng những service nào (hoặc mình có thể đọc `sst.config.ts` trong repo và rút ra danh sách quyền cần).

---

## Bước 5 — Tạo Access key cho IAM user (dùng trên máy)

1. IAM → **Users** → chọn user → tab **Security credentials**.
2. **Create access key**.
3. **Use case**: chọn **Command Line Interface (CLI)** (hoặc **Local code** nếu SDK).
4. AWS sẽ hiện **Access key ID** và **Secret access key** **một lần**.
5. **Lưu** secret vào password manager hoặc file an toàn; **không** commit lên Git.

Áp dụng **rotation**: định kỳ tạo key mới, cập nhật máy, xóa key cũ.

---

## Bước 6 — Cài AWS CLI v2 trên Windows

1. Mở trang cài đặt chính thức: https://aws.amazon.com/cli/
2. Tải **Windows installer (64-bit)** và chạy cài đặt.
3. Mở **PowerShell** mới, kiểm tra:

```powershell
aws --version
```

Kỳ vọng có dòng dạng `aws-cli/2.x.x`.

---

## Bước 7 — Cấu hình credential trên máy (`aws configure`)

Trong PowerShell:

```powershell
aws configure
```

Trình hỏi lần lượt:

| Prompt | Nhập gì |
|--------|---------|
| AWS Access Key ID | Chuỗi từ bước 5 |
| AWS Secret Access Key | Chuỗi bí mật từ bước 5 |
| Default region name | Ví dụ `ap-southeast-1` |
| Default output format | `json` (hoặc `text`) |

File lưu mặc định:

- `C:\Users\<username>\.aws\credentials`
- `C:\Users\<username>\.aws\config`

**Không** chia sẻ thư mục `.aws` công khai.

---

## Bước 8 — Kiểm tra đăng nhập API/CLI thành công

```powershell
aws sts get-caller-identity
```

Kết quả JSON có `UserId`, `Account`, `Arn` là user/role đúng.

Thử liệt kê DynamoDB (nếu user có quyền):

```powershell
aws dynamodb list-tables --region ap-southeast-1
```

(Nếu báo `AccessDenied`, policy chưa đủ quyền — quay lại bước 4.)

---

## Bước 9 — (Khuyến nghị) Bật MFA cho IAM user có console

1. IAM → user → **Security credentials** → **Assign MFA device**.
2. Làm theo wizard (app authenticator hoặc hardware key).

---

## Bước 10 — Phân biệt: IAM user (máy dev) vs IAM role (Lambda)

| Đối tượng | Mục đích |
|-----------|----------|
| **IAM user + access key** | Developer chạy CLI trên PC, CI pipeline deploy. |
| **IAM role (Lambda execution role)** | Lambda **assume role** khi chạy; không lưu secret trên disk Lambda. Tạo trong IAM → **Roles** → trusted entity **AWS service** → **Lambda**. Gán policy tối thiểu: DynamoDB bảng cụ thể, `ses:SendEmail`, `logs:*` cho log group prefix, SQS ARN cụ thể. |

Luồng đúng: dev user có quyền **tạo/cập nhật** Lambda và **gán role**; bản thân Lambda không dùng access key của user.

---

## Tóm tắt checklist

1. Đăng console → chọn region.
2. IAM → tạo **user**.
3. Gắn **policy** (custom tốt hơn admin toàn phần).
4. Tạo **access key**.
5. Cài **AWS CLI v2**.
6. `aws configure`.
7. `aws sts get-caller-identity`.
8. Bật **MFA** nếu user có console.

---

## Liên kết

- [Tích hợp AWS — cảnh báo tồn & async](./aws-low-stock-and-async.md)
