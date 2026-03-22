import { DataSource } from 'typeorm';
import { RoleCode, UserStatus } from '../../common/constants/user.constant';
import { Role } from '../entities/role.entity';
import { User } from '../entities/user.entity';
import { createOrGetFirebaseUidByPhone } from './firebase-auth.seed-helper';

type SeedUserDef = {
  username: string;
  phone: string;
  fullName: string;
  roleCode: RoleCode;
};

const SEED_USERS: SeedUserDef[] = [
  {
    username: 'admin@gmail.com',
    phone: '0900000001',
    fullName: 'Quản trị viên',
    roleCode: RoleCode.ADMIN,
  },
  {
    username: 'warehouse@gmail.com',
    phone: '0900000002',
    fullName: 'Nhân viên kho',
    roleCode: RoleCode.WAREHOUSE,
  },
  {
    username: 'manager@gmail.com',
    phone: '0900000003',
    fullName: 'Quản lý',
    roleCode: RoleCode.MANAGER,
  },
];

/**
 * Tạo hoặc lấy user Firebase Auth theo SĐT → uid thật, rồi mới lưu DB.
 */
async function resolveFirebaseUidForSeed(def: SeedUserDef): Promise<string> {
  console.log(
    `[seed] Gọi Firebase Auth (create/get theo SĐT) → lấy firebase_id cho ${def.username}`,
  );
  const uid = await createOrGetFirebaseUidByPhone(def.phone, def.fullName);
  if (!uid) {
    throw new Error(
      `[seed] Không lấy được Firebase uid cho ${def.username}: cấu hình FIREBASE_SERVICE_ACCOUNT_JSON_FILE, ` +
        'FIREBASE_SERVICE_ACCOUNT_JSON_B64 hoặc FIREBASE_SERVICE_ACCOUNT_JSON; bật Phone provider trên Firebase Console.',
    );
  }
  return uid;
}

/**
 * Idempotent: bỏ qua nếu đã có user trùng **username** hoặc **phone**
 * (tránh lỗi UNIQUE khi đổi seed nhưng DB vẫn giữ bản ghi cũ).
 * Cần gọi sau `seedRolesAndPermissions`.
 */
export async function seedUsers(dataSource: DataSource): Promise<void> {
  const userRepo = dataSource.getRepository(User);
  const roleRepo = dataSource.getRepository(Role);

  for (const def of SEED_USERS) {
    const exists = await userRepo.findOne({
      where: [{ username: def.username }, { phone: def.phone }],
    });
    if (exists) {
      continue;
    }

    const role = await roleRepo.findOne({ where: { code: def.roleCode } });
    if (!role) {
      throw new Error(
        `seedUsers: role "${def.roleCode}" chưa có — chạy seedRolesAndPermissions trước`,
      );
    }

    const firebaseUid = await resolveFirebaseUidForSeed(def);

    const uidTaken = await userRepo.findOne({
      where: { firebaseId: firebaseUid },
    });
    if (uidTaken) {
      console.warn(
        `[seed] firebase_id ${firebaseUid} đã gán cho ${uidTaken.username} — bỏ qua ${def.username}`,
      );
      continue;
    }

    const user = userRepo.create({
      username: def.username,
      phone: def.phone,
      firebaseId: firebaseUid,
      fullName: def.fullName,
      status: UserStatus.ACTIVE,
      email: null,
      avatarUrl: null,
      dob: null,
    });
    await userRepo.save(user);
    await dataSource
      .createQueryBuilder()
      .relation(User, 'roles')
      .of(user.id)
      .add(role.id);
  }
}
