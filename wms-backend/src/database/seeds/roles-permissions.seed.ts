import { DataSource } from 'typeorm';
import { PermissionCode, RoleCode } from '../../common/constants/user.constant';
import { Permission } from '../entities/permission.entity';
import { Role } from '../entities/role.entity';

const PERMISSION_DEFS: Array<{
  code: string;
  name: string;
  resource: string;
  action: string;
}> = [
  {
    code: PermissionCode.USER_CREATE,
    name: 'Tạo người dùng',
    resource: 'user',
    action: 'create',
  },
  {
    code: PermissionCode.USER_READ,
    name: 'Xem người dùng',
    resource: 'user',
    action: 'read',
  },
  {
    code: PermissionCode.USER_UPDATE,
    name: 'Cập nhật người dùng',
    resource: 'user',
    action: 'update',
  },
  {
    code: PermissionCode.USER_ASSIGN_ROLE,
    name: 'Gán vai trò',
    resource: 'user',
    action: 'assign_role',
  },
  {
    code: PermissionCode.USER_DELETE,
    name: 'Vô hiệu hóa / xóa user',
    resource: 'user',
    action: 'delete',
  },
  {
    code: PermissionCode.INBOUND_COMPLETE,
    name: 'Hoàn tất nhập kho',
    resource: 'inbound',
    action: 'complete',
  },
  {
    code: PermissionCode.OUTBOUND_COMPLETE,
    name: 'Hoàn tất xuất kho',
    resource: 'outbound',
    action: 'complete',
  },
];

/**
 * Idempotent: bỏ qua nếu đã có permission `user.create`.
 */
export async function seedRolesAndPermissions(
  dataSource: DataSource,
): Promise<void> {
  const permRepo = dataSource.getRepository(Permission);
  const existing = await permRepo.findOne({
    where: { code: PermissionCode.USER_CREATE },
  });
  if (existing) {
    return;
  }

  const permissions = await permRepo.save(
    PERMISSION_DEFS.map((d) =>
      permRepo.create({
        code: d.code,
        name: d.name,
        resource: d.resource,
        action: d.action,
        description: null,
      }),
    ),
  );

  const byCode = new Map(permissions.map((p) => [p.code, p]));
  const all = permissions;

  const whSubset = [
    PermissionCode.USER_READ,
    PermissionCode.INBOUND_COMPLETE,
    PermissionCode.OUTBOUND_COMPLETE,
  ].map((c) => byCode.get(c)!);

  const mgrSubset = [
    PermissionCode.USER_READ,
    PermissionCode.USER_UPDATE,
    PermissionCode.USER_ASSIGN_ROLE,
    PermissionCode.INBOUND_COMPLETE,
    PermissionCode.OUTBOUND_COMPLETE,
  ].map((c) => byCode.get(c)!);

  const roleRepo = dataSource.getRepository(Role);

  const admin = roleRepo.create({
    code: RoleCode.ADMIN,
    name: 'Quản trị',
    description: 'Toàn quyền cấu hình và người dùng',
    permissions: all,
  });
  const warehouse = roleRepo.create({
    code: RoleCode.WAREHOUSE,
    name: 'Nhân viên kho',
    description: 'Thao tác chứng từ nhập/xuất',
    permissions: whSubset,
  });
  const manager = roleRepo.create({
    code: RoleCode.MANAGER,
    name: 'Quản lý',
    description: 'Duyệt/hoàn tất và quản lý user',
    permissions: mgrSubset,
  });

  await roleRepo.save([admin, warehouse, manager]);
}
