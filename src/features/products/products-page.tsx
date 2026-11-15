"use client";

import { useMemo, useState } from 'react'
import {
  AlertTriangleIcon,
  ArchiveIcon,
  ArchiveRestoreIcon,
  BoxesIcon,
  EyeIcon,
  MoreHorizontalIcon,
  PackageIcon,
  PencilIcon,
  PlusIcon,
  Trash2Icon,
  WalletIcon,
} from 'lucide-react'
import { toast } from 'sonner'

import { ProductThumbnail } from '@/components/pos/product-thumbnail'
import { ConfirmDialog } from '@/components/shared/confirm-dialog'
import { DataTable, type DataTableColumn } from '@/components/shared/data-table'
import { EmptyState } from '@/components/shared/empty-state'
import { FilterSelect } from '@/components/shared/filter-select'
import { PageHeader } from '@/components/shared/page-header'
import { SearchInput } from '@/components/shared/search-input'
import { StatTile } from '@/components/shared/stat-tile'
import { StatusBadge } from '@/components/shared/status-badge'
import { StockBadge } from '@/components/shared/stock-badge'
import { TablePagination } from '@/components/shared/table-pagination'
import { Button } from '@/components/ui/button'
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu'
import { usePagination } from '@/hooks/use-pagination'
import {
  getCategoryName,
  isLowStock,
  isOutOfStock,
} from '@/lib/business-selectors'
import { formatCurrency, formatNumber } from '@/lib/format'
import { useBusinessStore } from '@/stores/business-store'
import type { Product } from '@/types/business'
import { ProductDetailSheet } from './product-detail-sheet'
import { ProductFormDialog, type ProductFormValues } from './product-form-dialog'

const STATUS_OPTIONS = [
  { value: 'all', label: 'Semua status' },
  { value: 'active', label: 'Aktif' },
  { value: 'archived', label: 'Diarsipkan' },
] as const

const STOCK_OPTIONS = [
  { value: 'all', label: 'Semua stok' },
  { value: 'low', label: 'Stok menipis' },
  { value: 'out', label: 'Stok habis' },
] as const

export function ProductsPage() {
  const {
    products,
    categories,
    transactions,
    addProduct,
    updateProduct,
    setProductStatus,
    deleteProduct,
  } = useBusinessStore()

  const [search, setSearch] = useState('')
  const [categoryId, setCategoryId] = useState('all')
  const [status, setStatus] = useState('all')
  const [stockFilter, setStockFilter] = useState('all')
  const [formOpen, setFormOpen] = useState(false)
  const [editing, setEditing] = useState<Product | null>(null)
  const [detail, setDetail] = useState<Product | null>(null)
  const [deleteTarget, setDeleteTarget] = useState<Product | null>(null)

  const categoryOptions = useMemo(
    () => [
      { value: 'all', label: 'Semua kategori' },
      ...categories.map((category) => ({
        value: category.id,
        label: category.name,
      })),
    ],
    [categories],
  )

  const filtered = useMemo(() => {
    const query = search.trim().toLowerCase()

    return products.filter((product) => {
      const matchesQuery =
        query.length === 0 ||
        product.name.toLowerCase().includes(query) ||
        product.sku.toLowerCase().includes(query) ||
        (product.barcode ?? '').includes(query)
      const matchesCategory =
        categoryId === 'all' || product.categoryId === categoryId
      const matchesStatus = status === 'all' || product.status === status
      const matchesStock =
        stockFilter === 'all' ||
        (stockFilter === 'low' && isLowStock(product)) ||
        (stockFilter === 'out' && isOutOfStock(product))

      return matchesQuery && matchesCategory && matchesStatus && matchesStock
    })
  }, [products, search, categoryId, status, stockFilter])

  const pagination = usePagination(filtered.length, 10)
  const rows = filtered.slice(pagination.start, pagination.end)

  const activeCount = products.filter((product) => product.status === 'active').length
  const lowCount = products.filter(isLowStock).length
  const outCount = products.filter(isOutOfStock).length
  const stockValue = products.reduce(
    (total, product) => total + product.cost * product.stock,
    0,
  )

  const openCreate = () => {
    setEditing(null)
    setFormOpen(true)
  }

  const openEdit = (product: Product) => {
    setDetail(null)
    setEditing(product)
    setFormOpen(true)
  }

  const handleSubmit = (values: ProductFormValues) => {
    const duplicate = products.some(
      (product) =>
        product.id !== editing?.id &&
        product.sku.toLowerCase() === values.sku.trim().toLowerCase(),
    )
    if (duplicate) {
      toast.error('SKU sudah dipakai', {
        description: 'Gunakan SKU lain agar produk mudah dibedakan.',
      })
      return false
    }

    if (editing) {
      updateProduct(editing.id, values)
      toast.success('Produk diperbarui', { description: values.name })
    } else {
      const result = addProduct(values)
      if (!result.ok) {
        toast.error('Produk tidak dapat ditambahkan', {
          description: result.reason,
        })
        return false
      }
      toast.success('Produk ditambahkan', { description: values.name })
    }
    return true
  }

  const handleToggleStatus = (product: Product) => {
    const next = product.status === 'active' ? 'archived' : 'active'
    setProductStatus(product.id, next)
    toast.success(
      next === 'active' ? 'Produk diaktifkan' : 'Produk diarsipkan',
      { description: product.name },
    )
  }

  const handleDelete = () => {
    if (!deleteTarget) return
    const result = deleteProduct(deleteTarget.id)
    if (result.ok) {
      toast.success('Produk dihapus', { description: deleteTarget.name })
      setDeleteTarget(null)
    } else {
      toast.error('Tidak bisa menghapus produk', {
        description: result.reason,
      })
    }
  }

  const resetFilters = () => {
    setSearch('')
    setCategoryId('all')
    setStatus('all')
    setStockFilter('all')
  }

  const columns: DataTableColumn<Product>[] = [
    {
      key: 'product',
      header: 'Produk',
      cell: (product) => (
        <div className="flex items-center gap-3">
          <ProductThumbnail
            src={product.imageUrl}
            alt={product.name}
            size="sm"
          />
          <div className="min-w-0">
            <p className="truncate font-medium">{product.name}</p>
            <p className="truncate font-mono text-[11px] text-muted-foreground">
              {product.sku}
            </p>
          </div>
        </div>
      ),
    },
    {
      key: 'category',
      header: 'Kategori',
      headerClassName: 'hidden md:table-cell',
      className: 'hidden md:table-cell',
      cell: (product) => (
        <span className="text-muted-foreground">
          {getCategoryName(categories, product.categoryId)}
        </span>
      ),
    },
    {
      key: 'price',
      header: 'Harga jual',
      className: 'text-right tabular-nums',
      headerClassName: 'text-right',
      cell: (product) => formatCurrency(product.price),
    },
    {
      key: 'stock',
      header: 'Stok',
      cell: (product) => (
        <div className="flex items-center gap-2">
          <span className="text-sm tabular-nums">
            {formatNumber(product.stock)} {product.unit}
          </span>
          <StockBadge stock={product.stock} minStock={product.minStock} />
        </div>
      ),
    },
    {
      key: 'status',
      header: 'Status',
      headerClassName: 'hidden sm:table-cell',
      className: 'hidden sm:table-cell',
      cell: (product) => <StatusBadge status={product.status} />,
    },
    {
      key: 'actions',
      header: <span className="sr-only">Aksi</span>,
      headerClassName: 'w-10',
      className: 'text-right',
      cell: (product) => (
        <div onClick={(event) => event.stopPropagation()}>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="ghost"
                size="icon-sm"
                aria-label={`Aksi untuk ${product.name}`}
              >
                <MoreHorizontalIcon aria-hidden="true" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuLabel>Aksi produk</DropdownMenuLabel>
              <DropdownMenuItem onSelect={() => setDetail(product)}>
                <EyeIcon aria-hidden="true" />
                Lihat detail
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => openEdit(product)}>
                <PencilIcon aria-hidden="true" />
                Edit
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={() => handleToggleStatus(product)}>
                {product.status === 'active' ? (
                  <ArchiveIcon aria-hidden="true" />
                ) : (
                  <ArchiveRestoreIcon aria-hidden="true" />
                )}
                {product.status === 'active' ? 'Arsipkan' : 'Aktifkan'}
              </DropdownMenuItem>
              <DropdownMenuSeparator />
              <DropdownMenuItem
                variant="destructive"
                onSelect={() => setDeleteTarget(product)}
              >
                <Trash2Icon aria-hidden="true" />
                Hapus
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      ),
    },
  ]

  return (
    <div className="flex flex-col gap-5">
      <PageHeader
        title="Produk"
        description="Kelola katalog, harga, dan stok produk yang dijual di POS."
        actions={
          <Button onClick={openCreate}>
            <PlusIcon aria-hidden="true" />
            Tambah produk
          </Button>
        }
      />

      <section className="grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
        <StatTile
          label="Produk aktif"
          value={formatNumber(activeCount)}
          hint={`${formatNumber(products.length)} total produk`}
          icon={PackageIcon}
        />
        <StatTile
          label="Stok menipis"
          value={formatNumber(lowCount)}
          hint="Perlu restock"
          icon={AlertTriangleIcon}
          tone="warning"
        />
        <StatTile
          label="Stok habis"
          value={formatNumber(outCount)}
          hint="Tidak bisa dijual"
          icon={BoxesIcon}
          tone="destructive"
        />
        <StatTile
          label="Nilai stok"
          value={formatCurrency(stockValue)}
          hint="Berdasarkan harga modal"
          icon={WalletIcon}
          tone="success"
        />
      </section>

      <section className="overflow-hidden rounded-xl border border-border bg-card">
        <div className="flex flex-col gap-2 border-b border-border p-4 lg:flex-row lg:items-center">
          <SearchInput
            value={search}
            onChange={setSearch}
            placeholder="Cari nama, SKU, atau barcode…"
            className="lg:max-w-xs"
          />
          <div className="flex flex-wrap items-center gap-2 lg:ml-auto">
            <FilterSelect
              value={categoryId}
              onChange={setCategoryId}
              options={categoryOptions}
              ariaLabel="Filter kategori"
            />
            <FilterSelect
              value={status}
              onChange={setStatus}
              options={STATUS_OPTIONS}
              ariaLabel="Filter status"
            />
            <FilterSelect
              value={stockFilter}
              onChange={setStockFilter}
              options={STOCK_OPTIONS}
              ariaLabel="Filter stok"
            />
          </div>
        </div>

        <DataTable
          columns={columns}
          rows={rows}
          getRowKey={(product) => product.id}
          onRowClick={(product) => setDetail(product)}
          empty={
            products.length === 0 ? (
              <EmptyState
                icon={PackageIcon}
                title="Belum ada produk"
                description="Tambahkan produk pertama agar bisa dijual di POS."
                action={
                  <Button onClick={openCreate}>
                    <PlusIcon aria-hidden="true" />
                    Tambah produk
                  </Button>
                }
              />
            ) : (
              <EmptyState
                icon={PackageIcon}
                title="Tidak ada produk yang cocok"
                description="Coba ubah kata kunci atau filter yang dipilih."
                action={
                  <Button variant="outline" onClick={resetFilters}>
                    Reset filter
                  </Button>
                }
              />
            )
          }
        />

        <TablePagination
          page={pagination.page}
          pageCount={pagination.pageCount}
          total={filtered.length}
          start={pagination.start}
          end={pagination.end}
          onPageChange={pagination.setPage}
        />
      </section>

      <ProductFormDialog
        open={formOpen}
        onOpenChange={setFormOpen}
        product={editing}
        categories={categories}
        onSubmit={handleSubmit}
      />

      <ProductDetailSheet
        product={detail}
        categories={categories}
        transactions={transactions}
        open={detail !== null}
        onOpenChange={(open) => {
          if (!open) setDetail(null)
        }}
        onEdit={openEdit}
      />

      <ConfirmDialog
        open={deleteTarget !== null}
        onOpenChange={(open) => {
          if (!open) setDeleteTarget(null)
        }}
        title="Hapus produk?"
        description={
          deleteTarget
            ? `${deleteTarget.name} akan dihapus dari katalog. Tindakan ini tidak bisa dibatalkan.`
            : ''
        }
        confirmLabel="Hapus produk"
        destructive
        onConfirm={handleDelete}
      />
    </div>
  )
}
