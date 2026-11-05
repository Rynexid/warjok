/**
 * Minimal EMVCo/QRIS payload builder used by the checkout. The payload is
 * structurally valid (TLV + CRC16) so any QR scanner can read it.
 */

export const MERCHANT = {
  name: 'WARJOK',
  city: 'JAKARTA',
  /** National Merchant ID used on the printed QRIS card. */
  nmid: 'ID1023456789012',
  mcc: '5812',
} as const

/** TLV: 2-digit id + 2-digit length + value. */
function tlv(id: string, value: string): string {
  return `${id}${value.length.toString().padStart(2, '0')}${value}`
}

/** CRC-16/CCITT-FALSE, required by the EMVCo spec for field 63. */
function crc16(input: string): string {
  let crc = 0xffff

  for (let index = 0; index < input.length; index += 1) {
    crc ^= input.charCodeAt(index) << 8
    for (let bit = 0; bit < 8; bit += 1) {
      crc = (crc & 0x8000 ? (crc << 1) ^ 0x1021 : crc << 1) & 0xffff
    }
  }

  return crc.toString(16).toUpperCase().padStart(4, '0')
}

export type QrisPayloadInput = {
  merchantName?: string
  merchantCity?: string
  nmid?: string
  amount: number
  orderId: string
}

/**
 * Dynamic QRIS payload (point-of-initiation 12) with the transaction amount
 * embedded, so the customer never types the nominal.
 */
export function buildQrisPayload({
  merchantName = MERCHANT.name,
  merchantCity = MERCHANT.city,
  nmid = MERCHANT.nmid,
  amount,
  orderId,
}: QrisPayloadInput): string {
  const merchantAccount =
    tlv('00', 'ID.CO.QRIS.WWW') +
    tlv('01', nmid) +
    tlv('02', nmid) +
    tlv('03', 'UMI')

  const payload =
    tlv('00', '01') +
    tlv('01', '12') +
    tlv('26', merchantAccount) +
    tlv('52', MERCHANT.mcc) +
    tlv('53', '360') +
    tlv('54', amount.toString()) +
    tlv('58', 'ID') +
    tlv('59', merchantName) +
    tlv('60', merchantCity) +
    tlv('62', tlv('05', orderId))

  const withCrcField = `${payload}6304`

  return `${withCrcField}${crc16(withCrcField)}`
}
