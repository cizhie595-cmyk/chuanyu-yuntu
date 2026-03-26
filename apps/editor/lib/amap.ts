/**
 * 高德地图 API 工具函数
 * 用于将地址文本解析为行政区划代码（adcode）
 *
 * 需要环境变量：AMAP_API_KEY（高德 Web 服务 API Key）
 * 申请地址：https://console.amap.com/dev/key/app
 */

interface GeoCodeResult {
  adcode: string      // 行政区划代码（如 510116 = 成都市双流区）
  province: string    // 省
  city: string        // 市
  district: string    // 区/县
  formatted: string   // 格式化后的地址
}

/**
 * 地理编码：将地址文本转换为行政区划代码
 *
 * @param address 地址文本，如 "四川省成都市郫都区XX镇XX村"
 * @returns 行政区划代码和结构化地址信息，解析失败返回 null
 */
export async function geocodeAddress(address: string): Promise<GeoCodeResult | null> {
  const apiKey = process.env.AMAP_API_KEY

  if (!apiKey) {
    console.warn('[高德地图] 未配置 AMAP_API_KEY，跳过地址解析')
    return null
  }

  if (!address || address.trim().length < 3) {
    return null
  }

  try {
    const url = new URL('https://restapi.amap.com/v3/geocode/geo')
    url.searchParams.set('key', apiKey)
    url.searchParams.set('address', address.trim())
    url.searchParams.set('output', 'JSON')

    const response = await fetch(url.toString(), {
      signal: AbortSignal.timeout(5000), // 5秒超时
    })

    if (!response.ok) {
      console.error('[高德地图] API 请求失败:', response.status)
      return null
    }

    const data = await response.json()

    if (data.status !== '1' || !data.geocodes?.length) {
      console.warn('[高德地图] 地址解析无结果:', address)
      return null
    }

    const geo = data.geocodes[0]
    return {
      adcode: geo.adcode || '',
      province: geo.province || '',
      city: typeof geo.city === 'string' ? geo.city : '',
      district: geo.district || '',
      formatted: geo.formatted_address || address,
    }
  } catch (error) {
    console.error('[高德地图] 地址解析异常:', error)
    return null
  }
}

/**
 * 根据行政区划代码获取区域名称
 * 用于 B 端抢单大厅的地区筛选
 */
export function getRegionName(adcode: string): string {
  // 前2位 = 省，前4位 = 市，前6位 = 区/县
  if (!adcode || adcode.length < 6) return '未知地区'

  // 常见川渝地区代码映射
  const regionMap: Record<string, string> = {
    '51': '四川省',
    '50': '重庆市',
    '5101': '成都市',
    '5103': '自贡市',
    '5104': '攀枝花市',
    '5105': '泸州市',
    '5106': '德阳市',
    '5107': '绵阳市',
    '5108': '广元市',
    '5109': '遂宁市',
    '5110': '内江市',
    '5111': '乐山市',
    '5113': '南充市',
    '5114': '眉山市',
    '5115': '宜宾市',
    '5116': '广安市',
    '5117': '达州市',
    '5118': '雅安市',
    '5119': '巴中市',
    '5120': '资阳市',
    '5001': '重庆市区',
    '5002': '重庆郊县',
  }

  const province = regionMap[adcode.slice(0, 2)] || ''
  const city = regionMap[adcode.slice(0, 4)] || ''

  if (city) return city
  if (province) return province
  return '未知地区'
}
