import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import moment from 'moment'
import { useTranslation } from 'react-i18next'
import { SquareMenu } from 'lucide-react'

import { Button } from '@/components/ui'
import { useExportPayment, useInitiatePayment, useOrderBySlug } from '@/hooks'
import { PaymentMethod, ROUTE } from '@/constants'
import { formatCurrency, loadDataToPrinter, showToast } from '@/utils'
import { ButtonLoading } from '@/components/app/loading'
import { ClientPaymentMethodSelect } from '@/components/app/select'
import { Label } from '@radix-ui/react-context-menu'

export function ClientPaymentPage() {
  const { t } = useTranslation(['menu'])
  const { t: tToast } = useTranslation(['toast'])
  const [searchParams] = useSearchParams()
  const slug = searchParams.get('order')
  const navigate = useNavigate()
  const [paymentMethod, setPaymentMethod] = useState<string>('')
  const { data: order, refetch: refetchOrder } = useOrderBySlug(slug as string)
  const { mutate: initiatePayment, isPending: isPendingInitiatePayment } =
    useInitiatePayment()
  const { mutate: exportPayment, isPending: isPendingExportPayment } =
    useExportPayment()
  const [qrCode, setQrCode] = useState<string>('')
  const [paymentSlug, setPaymentSlug] = useState<string>('')
  const [isPolling, setIsPolling] = useState<boolean>(false)
  const [isDisabled, setDisabled] = useState<boolean>(false)

  useEffect(() => {
    setDisabled(!paymentMethod || !slug)
  }, [paymentMethod, slug])

  useEffect(() => {
    let interval: NodeJS.Timeout | null = null

    if (isPolling) {
      interval = setInterval(async () => {
        const updatedOrder = await refetchOrder()
        const orderStatus = updatedOrder.data?.result?.status
        if (orderStatus === 'paid') {
          clearInterval(interval!)
          navigate(`${ROUTE.ORDER_SUCCESS}/${slug}`)
        }
      }, 3000) // Call APi every 3 seconds
    }

    return () => {
      if (interval) clearInterval(interval)
    }
  }, [isPolling, refetchOrder, navigate, slug])

  const handleSelectPaymentMethod = (selectedPaymentMethod: string) => {
    setPaymentMethod(selectedPaymentMethod)
  }

  const handleConfirmPayment = () => {
    if (!slug || !paymentMethod) return

    if (paymentMethod === PaymentMethod.BANK_TRANSFER) {
      initiatePayment(
        { orderSlug: slug, paymentMethod },
        {
          onSuccess: (data) => {
            setPaymentSlug(data.result.slug)
            setQrCode(data.result.qrCode)
            setIsPolling(true) // Bắt đầu polling khi thanh toán qua chuyển khoản ngân hàng
          },
        },
      )
    } else if (paymentMethod === PaymentMethod.CASH) {
      initiatePayment(
        { orderSlug: slug, paymentMethod },
        {
          onSuccess: () => {
            navigate(`${ROUTE.ORDER_SUCCESS}/${slug}`)
          },
        },
      )
    }
  }

  const handleExportPayment = () => {
    if (!slug) return
    exportPayment(paymentSlug, {
      onSuccess: (data: Blob) => {
        showToast(tToast('toast.exportPaymentSuccess'))
        loadDataToPrinter(data)
      },
    })
  }

  if (!order) return <div>Đơn hàng không tồn tại</div>

  return (
    <div className="container py-10">
      <span className="flex items-center justify-start w-full gap-1 text-lg">
        <SquareMenu />
        {t('menu.payment')}
        <span className="text-muted-foreground">#{slug}</span>
      </span>
      <div className="flex flex-col gap-3 mt-5">
        <div className="flex flex-col gap-5 lg:flex-row">
          {/* Customer info */}
          <div className="w-full lg:w-1/3">
            <div className="flex flex-col gap-1 p-4 bg-muted">
              <Label className="text-md">{t('paymentMethod.userInfo')}</Label>
            </div>
            <div className="flex flex-col gap-3 p-3 border border-gray-200 rounded">
              <div className="grid grid-cols-2 gap-2">
                <h3 className="col-span-1 text-sm font-medium">
                  {t('order.customerName')}
                </h3>
                <p className="text-sm font-semibold">{`${order.result.owner.lastName} ${order.result.owner.firstName}`}</p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <h3 className="col-span-1 text-sm font-medium">
                  {t('order.orderDate')}
                </h3>
                <span className="text-sm font-semibold">
                  {moment(order.result.createdAt).format('HH:mm:ss DD/MM/YYYY')}
                </span>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <h3 className="col-span-1 text-sm font-medium">
                  {t('order.phoneNumber')}
                </h3>
                <p className="text-sm font-semibold">
                  {order.result.owner.phonenumber}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <h3 className="col-span-1 text-sm font-medium">
                  {t('order.deliveryMethod')}
                </h3>
                <p className="col-span-1 text-sm font-semibold">
                  {order.result.type === 'at-table'
                    ? t('order.dineIn')
                    : t('order.takeAway')}
                </p>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <h3 className="col-span-1 text-sm font-medium">
                  {t('order.location')}
                </h3>
                <p className="col-span-1 text-sm font-semibold">
                  {order.result.table && t('order.tableNumber')}{' '}
                  {order.result.table ? order.result.table.name : ''}
                </p>
              </div>
            </div>
          </div>
          {/* Thông tin đơn hàng */}
          <div className="w-full lg:w-2/3">
            <div className="grid w-full grid-cols-5 px-4 py-3 mb-2 text-sm font-thin rounded-md bg-muted-foreground/10">
              <span className="col-span-2 text-xs">{t('order.product')}</span>
              <span className="col-span-1 text-xs">{t('order.unitPrice')}</span>
              <span className="col-span-1 text-xs text-center">
                {t('order.quantity')}
              </span>
              <span className="col-span-1 text-xs text-center">
                {t('order.grandTotal')}
              </span>
            </div>
            <div className="flex flex-col w-full border rounded-md bg-background">
              {order?.result.orderItems.map((item) => (
                <div
                  key={item.slug}
                  className="grid items-center w-full gap-4 p-4 pb-4 border-b rounded-t-md"
                >
                  <div className="grid flex-row items-center w-full grid-cols-5">
                    <div className="flex w-full col-span-2 gap-2">
                      <div className="flex flex-col items-center justify-start gap-2 sm:flex-row sm:justify-center">
                        <div className="flex flex-col">
                          <span className="text-sm font-bold truncate sm:text-lg">
                            {item.variant.product.name}
                          </span>
                        </div>
                      </div>
                    </div>
                    <div className="flex items-center col-span-1">
                      <span className="text-sm">
                        {`${formatCurrency(item.variant.price || 0)}`}
                      </span>
                    </div>
                    <div className="flex justify-center col-span-1">
                      <span className="text-sm">{item.quantity || 0}</span>
                    </div>
                    <div className="col-span-1 text-end">
                      <span className="text-sm">
                        {`${formatCurrency((item.variant.price || 0) * item.quantity)}`}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
              <div className="flex flex-col items-end w-full gap-2 px-2 py-4">
                <div className="flex w-[20rem] flex-col gap-2">
                  <div className="flex justify-between w-full pb-4 border-b">
                    <h3 className="text-sm font-medium">{t('order.total')}</h3>
                    <p className="text-sm font-semibold">
                      {`${formatCurrency(order.result.subtotal || 0)}`}
                    </p>
                  </div>
                  <div className="flex flex-col">
                    <div className="flex justify-between w-full">
                      <h3 className="font-semibold text-md">
                        {t('order.totalPayment')}
                      </h3>
                      <p className="text-lg font-semibold text-primary">
                        {`${formatCurrency(order.result.subtotal || 0)}`}
                      </p>
                    </div>
                    <span className="text-xs text-muted-foreground">
                      {t('order.vat')}
                    </span>
                  </div>
                  <p className="flex items-center justify-end col-span-2 text-lg font-semibold text-primary">
                    {`${formatCurrency(order.result.subtotal || 0)}`}
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
        {/* Lựa chọn phương thức thanh toán */}
        <ClientPaymentMethodSelect
          qrCode={qrCode ? qrCode : ''}
          total={order.result ? order.result.subtotal : 0}
          onSubmit={handleSelectPaymentMethod}
        />
        <div className="flex justify-end py-6">
          {(paymentMethod === PaymentMethod.BANK_TRANSFER ||
            paymentMethod === PaymentMethod.CASH) && (
              <div className="flex gap-2">
                {!paymentSlug && (
                  <Button
                    disabled={isDisabled || isPendingInitiatePayment}
                    className="w-fit"
                    onClick={handleConfirmPayment}
                  >
                    {isPendingInitiatePayment && <ButtonLoading />}
                    {t('paymentMethod.confirmPayment')}
                  </Button>
                )}
                {paymentSlug && (
                  <Button
                    disabled={isDisabled || isPendingExportPayment}
                    className="w-fit"
                    onClick={handleExportPayment}
                  >
                    {isPendingExportPayment && <ButtonLoading />}
                    {t('paymentMethod.exportPayment')}
                  </Button>
                )}
              </div>
            )}
        </div>
      </div>
    </div>
  )
}
