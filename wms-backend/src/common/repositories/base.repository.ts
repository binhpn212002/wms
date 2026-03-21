import {
  DeepPartial,
  DeleteResult,
  FindManyOptions,
  FindOneOptions,
  FindOptionsWhere,
  QueryDeepPartialEntity,
  Repository,
  SelectQueryBuilder,
  UpdateResult,
} from 'typeorm';
import { BaseEntity } from '../../shared/base.entity';
import { ListResponseDto } from '../dto/list-response.dto';
import { PageOptionDto } from '../dto/page-option.dto';

/**
 * Base repository — các repository module kế thừa và mở rộng (kết hợp @InjectRepository khi cần).
 */
export abstract class BaseRepository<T extends BaseEntity> {
  constructor(protected readonly repository: Repository<T>) {}

  createQueryBuilder(alias?: string): SelectQueryBuilder<T> {
    return this.repository.createQueryBuilder(alias);
  }

  /** Tìm theo khóa chính `id` (uuid). */
  findById(id: string): Promise<T | null> {
    return this.repository.findOneBy({ id } as FindOptionsWhere<T>);
  }

  findOne(options: FindOneOptions<T>): Promise<T | null> {
    return this.repository.findOne(options);
  }

  findOneBy(where: FindOptionsWhere<T>): Promise<T | null> {
    return this.repository.findOneBy(where);
  }

  find(options?: FindManyOptions<T>): Promise<T[]> {
    return this.repository.find(options);
  }

  findBy(where: FindOptionsWhere<T>): Promise<T[]> {
    return this.repository.findBy(where);
  }

  /**
   * Lấy danh sách có phân trang (`findAndCount` + `skip`/`take`).
   *
   * Có thể lọc qua `where` và các tuỳ chọn TypeORM khác (`order`, `relations`, `select`, …)
   * — giống `repository.find()`, chỉ không tự truyền `skip`/`take` (do `pageOptions` quản lý).
   *
   * @example Điều kiện đơn giản
   * ```ts
   * await repo.findMany(page, { where: { active: true }, order: { createdAt: 'DESC' } });
   * ```
   * @example Tìm kiếm text (`q`) — dùng `ILike` (Postgres) hoặc `Like`; logic map `q` → `where` đặt ở repository/service
   * ```ts
   * import { ILike } from 'typeorm';
   * await repo.findMany(page, pageOptions.q
   *   ? { where: { name: ILike(`%${pageOptions.q}%`) } }
   *   : {});
   * ```
   */
  async findMany(
    pageOptions: PageOptionDto,
    options?: Omit<FindManyOptions<T>, 'skip' | 'take'>,
  ): Promise<ListResponseDto<T>> {
    pageOptions.normalize();
    const [data, total] = await this.repository.findAndCount({
      ...options,
      skip: pageOptions.skip,
      take: pageOptions.limit,
    });
    return ListResponseDto.create(
      data,
      total,
      pageOptions.page,
      pageOptions.limit,
    );
  }

  count(options?: FindManyOptions<T>): Promise<number> {
    return this.repository.count(options);
  }

  countBy(where: FindOptionsWhere<T>): Promise<number> {
    return this.repository.countBy(where);
  }

  existsBy(where: FindOptionsWhere<T>): Promise<boolean> {
    return this.repository.existsBy(where);
  }

  /** Tạo instance trong memory (chưa lưu DB). */
  create(entityLike: DeepPartial<T>): T {
    return this.repository.create(entityLike);
  }

  /** Tạo và lưu một bản ghi mới. */
  async createAndSave(entityLike: DeepPartial<T>): Promise<T> {
    const entity = this.repository.create(entityLike);
    return this.repository.save(entity);
  }

  save(entity: DeepPartial<T>): Promise<T> {
    return this.repository.save(entity);
  }

  merge(entity: T, ...entityLikes: DeepPartial<T>[]): T {
    return this.repository.merge(entity, ...entityLikes);
  }

  update(
    id: string,
    partial: QueryDeepPartialEntity<T>,
  ): Promise<UpdateResult> {
    return this.repository.update(id, partial);
  }

  delete(id: string): Promise<DeleteResult> {
    return this.repository.delete(id);
  }

  remove(entity: T): Promise<T> {
    return this.repository.remove(entity);
  }
}
