import { BadRequestException, Injectable, NotFoundException, OnModuleInit } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { EntityManager, ILike, Repository } from "typeorm";
import { ProductType } from "../entities/product_type.entity";
import { CreateProductTypeDto, UpdateProductTypeDto } from "../dto/create_product_type.dto";
import { ProductSubtype } from "../entities/product_subtype.entity";
import { Product } from "src/modules/products/entities/product.entity";
import { Laboratory } from "src/modules/laboratories/entities/laboratory.entity";

@Injectable()
export class ProductTypesService implements OnModuleInit {
  constructor(
    @InjectRepository(ProductType)
    private readonly repo: Repository<ProductType>,
    @InjectRepository(ProductSubtype)
    private readonly subtypesRepo: Repository<ProductSubtype>,
  ) {}

  private subtypeTableReady = false;

  async onModuleInit(): Promise<void> {
    await this.ensureDefaultTypesAndSubtypes();
  }

  // ✅ Listar y filtrar por nombre
  async findAll(name?: string): Promise<ProductType[]> {
    const where = {
      is_deleted: false,
      ...(name ? { name: ILike(`%${name}%`) } : {}), // <-- Filtro parcial por coincidencia
    };

    return this.repo.find({
      where,
      order: { name: "ASC" }, // <-- Orden alfabético por nombre
    });
  }

  async findOne(id: number): Promise<ProductType> {
    const productType = await this.repo.findOne({ where: { id_type: id, is_deleted: false } });
    if (!productType) {
      throw new NotFoundException(`Tipo de producto con id ${id} no encontrado`);
    }
    return productType;
  }

  async findSubtypesByType(typeId: number): Promise<ProductSubtype[]> {
    await this.findOne(typeId);
    return this.subtypesRepo.find({
      where: { id_type: typeId, is_deleted: false, is_active: true },
      order: { name: 'ASC' },
    });
  }

  async create(dto: CreateProductTypeDto): Promise<ProductType> {
    const newType = this.repo.create(dto);
    return await this.repo.save(newType);
  }

  async update(id: number, dto: UpdateProductTypeDto): Promise<ProductType> {
    const productType = await this.findOne(id);
    Object.assign(productType, dto);
    productType.updated_at = new Date();
    return await this.repo.save(productType);
  }

  async remove(id: number) {
    const productType = await this.findOne(id);
    if (productType.name.trim().toLowerCase() === 'medicamento') {
      throw new BadRequestException('No se puede eliminar el tipo de producto "Medicamento".');
    }
    productType.is_deleted = true;
    await this.repo.save(productType);
    return { message: "Tipo de producto eliminado correctamente" };
  }

  private async ensureDefaultTypesAndSubtypes(): Promise<void> {
    await this.ensureSubtypeTableExists();
    const defaultTypes = ['Medicamento', 'Higiene personal', 'Limpieza', 'Crema'];
    const subtypesByType: Record<string, string[]> = {
      Medicamento: ['Pastilla', 'Jarabe', 'Ampolla', 'Parche', 'Gel'],
    };

    for (const name of defaultTypes) {
      let productType = await this.repo
        .createQueryBuilder('type')
        .where('LOWER(type.name) = LOWER(:name)', { name })
        .getOne();

      if (!productType) {
        productType = this.repo.create({ name, description: null, is_active: true, is_deleted: false });
      } else {
        let changed = false;
        if (!productType.is_active) {
          productType.is_active = true;
          changed = true;
        }
        if (productType.is_deleted) {
          productType.is_deleted = false;
          changed = true;
        }
        if (changed) {
          productType.updated_at = new Date();
        }
      }

      productType = await this.repo.save(productType);

      const defaultSubtypes = subtypesByType[name];
      if (defaultSubtypes && defaultSubtypes.length) {
        await this.ensureDefaultSubtypes(productType, defaultSubtypes);
      }
    }
  }

  private async ensureDefaultSubtypes(productType: ProductType, names: string[]): Promise<void> {
    for (const name of names) {
      let subtype = await this.subtypesRepo
        .createQueryBuilder('subtype')
        .where('subtype.id_type = :typeId', { typeId: productType.id_type })
        .andWhere('LOWER(subtype.name) = LOWER(:name)', { name })
        .getOne();

      if (!subtype) {
        subtype = this.subtypesRepo.create({
          id_type: productType.id_type,
          name,
          is_active: true,
          is_deleted: false,
        });
      } else {
        let changed = false;
        if (!subtype.is_active) {
          subtype.is_active = true;
          changed = true;
        }
        if (subtype.is_deleted) {
          subtype.is_deleted = false;
          changed = true;
        }
        if (changed) {
          subtype.updated_at = new Date();
        }
      }

      await this.subtypesRepo.save(subtype);
    }
  }

  private async ensureSubtypeTableExists(): Promise<void> {
    if (this.subtypeTableReady) {
      return;
    }

    const subtypeMetadata = this.subtypesRepo.metadata;
    const typeMetadata = this.repo.metadata;

    const schema = subtypeMetadata.schema || 'public';
    const tableName = subtypeMetadata.tableName;
    const qualifiedIdentifier = schema ? `${schema}.${tableName}` : tableName;
    const rawResult = await this.repo.query('SELECT to_regclass($1) AS table_exists', [qualifiedIdentifier]);
    const exists = rawResult?.[0]?.table_exists;

    if (!exists) {
      const quotedSchema = schema ? `"${schema}".` : '';
      const quotedSubtypeTable = `${quotedSchema}"${tableName}"`;
      const typeSchema = typeMetadata.schema ? `"${typeMetadata.schema}".` : '';
      const quotedTypeTable = `${typeSchema}"${typeMetadata.tableName}"`;
      const fkName = `fk_${tableName}_id_type`;

      await this.repo.query(
        `CREATE TABLE IF NOT EXISTS ${quotedSubtypeTable} (
          id_subtype SERIAL PRIMARY KEY,
          name VARCHAR(120) NOT NULL,
          id_type INTEGER NOT NULL,
          is_active BOOLEAN NOT NULL DEFAULT true,
          is_deleted BOOLEAN NOT NULL DEFAULT false,
          created_at TIMESTAMP NOT NULL DEFAULT now(),
          updated_at TIMESTAMP NOT NULL DEFAULT now()
        );`
      );

      await this.repo.query(
        `ALTER TABLE ${quotedSubtypeTable}
          ADD CONSTRAINT ${fkName} FOREIGN KEY (id_type)
          REFERENCES ${quotedTypeTable}(id_type)
          ON DELETE CASCADE;`
      ).catch(() => undefined);

      await this.repo.query(
        `CREATE INDEX IF NOT EXISTS idx_${tableName}_id_type ON ${quotedSubtypeTable} (id_type);`
      );

      await this.repo.query(
        `CREATE UNIQUE INDEX IF NOT EXISTS uq_${tableName}_type_name ON ${quotedSubtypeTable} (id_type, LOWER(name));`
      );
    }

    await this.ensureProductRelationColumns(schema ?? 'public', tableName);
    this.subtypeTableReady = true;
  }

  private async ensureProductRelationColumns(subtypeSchema: string, subtypeTable: string): Promise<void> {
    const manager = this.repo.manager;
    const connection = manager.connection;
    const productMetadata = connection.getMetadata(Product);
    const laboratoryMetadata = connection.getMetadata(Laboratory);

    const productSchema = productMetadata.schema ?? 'public';
    const productTable = productMetadata.tableName;
    const qualifiedProductTable = productSchema ? `"${productSchema}"."${productTable}"` : `"${productTable}"`;

    const qualifiedSubtypeTable = subtypeSchema ? `"${subtypeSchema}"."${subtypeTable}"` : `"${subtypeTable}"`;

    const laboratorySchema = laboratoryMetadata.schema ?? 'public';
    const laboratoryTable = laboratoryMetadata.tableName;
    const qualifiedLaboratoryTable = laboratorySchema ? `"${laboratorySchema}"."${laboratoryTable}"` : `"${laboratoryTable}"`;

    await this.ensureColumnWithForeignKey({
      manager,
      tableSchema: productSchema,
      tableName: productTable,
      qualifiedTable: qualifiedProductTable,
      columnName: 'id_subtype',
      columnSql: 'INTEGER NULL',
      indexName: `idx_${productTable}_id_subtype`,
      fkName: `fk_${productTable}_id_subtype`,
      referencedTable: qualifiedSubtypeTable,
      referencedColumn: 'id_subtype',
      onDelete: 'SET NULL',
    });

    await this.ensureColumnWithForeignKey({
      manager,
      tableSchema: productSchema,
      tableName: productTable,
      qualifiedTable: qualifiedProductTable,
      columnName: 'id_laboratory',
      columnSql: 'INTEGER NULL',
      indexName: `idx_${productTable}_id_laboratory`,
      fkName: `fk_${productTable}_id_laboratory`,
      referencedTable: qualifiedLaboratoryTable,
      referencedColumn: 'id_laboratory',
      onDelete: 'SET NULL',
    });
  }

  private async ensureColumnWithForeignKey(options: {
    manager: EntityManager;
    tableSchema: string;
    tableName: string;
    qualifiedTable: string;
    columnName: string;
    columnSql: string;
    indexName: string;
    fkName: string;
    referencedTable: string;
    referencedColumn: string;
    onDelete: string;
  }): Promise<void> {
    const {
      manager,
      tableSchema,
      tableName,
      qualifiedTable,
      columnName,
      columnSql,
      indexName,
      fkName,
      referencedTable,
      referencedColumn,
      onDelete,
    } = options;

    const columnExists = await manager.query(
      `SELECT 1 FROM information_schema.columns WHERE table_schema = $1 AND table_name = $2 AND column_name = $3`,
      [tableSchema, tableName, columnName],
    );

    if (!columnExists?.length) {
      await manager.query(`ALTER TABLE ${qualifiedTable} ADD COLUMN ${columnName} ${columnSql};`);
    }

    await manager.query(`CREATE INDEX IF NOT EXISTS ${indexName} ON ${qualifiedTable} (${columnName});`);

    const constraintExists = await manager.query(
      `SELECT 1 FROM information_schema.table_constraints WHERE table_schema = $1 AND table_name = $2 AND constraint_name = $3`,
      [tableSchema, tableName, fkName],
    );

    if (!constraintExists?.length) {
      await manager
        .query(
          `ALTER TABLE ${qualifiedTable}
          ADD CONSTRAINT ${fkName} FOREIGN KEY (${columnName})
          REFERENCES ${referencedTable}(${referencedColumn})
          ON DELETE ${onDelete};`,
        )
        .catch(() => undefined);
    }
  }
}
