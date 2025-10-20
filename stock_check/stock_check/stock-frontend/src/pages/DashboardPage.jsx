import React, { useState, useEffect, useMemo, useRef } from 'react';
import { Layout, Row, Col, Card, Spin, Alert, AutoComplete, Input, Typography, Statistic, Tag, Skeleton, Tabs, Checkbox, List, Segmented } from 'antd';
import axiosClient from '../api/axiosClient';
import AIChat from '../components/AIChat';
import StockChart from '../components/StockChart';
import AppHeader from '../components/AppHeader';
import { useSearchParams } from 'react-router-dom';

import { SMA, EMA, RSI, Bollinger, MACD } from '../utils/indicators-client';
import { memoCalc, hashArr } from '../utils/indicators-cache';

const { Content, Sider } = Layout;
const { Title, Paragraph, Text, Link } = Typography;

const MAX_POINTS = 1000; // giới hạn số nến cho hiệu năng

const indicatorOptionsConst = [
  { label: 'SMA 20', value: 'SMA-20' },
  { label: 'SMA 50', value: 'SMA-50' },
  { label: 'EMA 20', value: 'EMA-20' },
  { label: 'EMA 50', value: 'EMA-50' },
  { label: 'RSI 14', value: 'RSI-14' },
  { label: 'BB 20/2', value: 'BB-20-2' },
  { label: 'MACD 12-26-9', value: 'MACD-12-26-9' },
];

const getTrendColor = (trend) => {
  if (trend === 'Tăng') return 'green';
  if (trend === 'Giảm') return 'red';
  return 'grey';
};

const DashboardPage = () => {
  const [searchParams, setSearchParams] = useSearchParams();

  // === STATE ===
  const [symbols, setSymbols] = useState({ data: [], loading: true, error: null });
  const [selectedSymbol, setSelectedSymbol] = useState(null);

  const [overview, setOverview] = useState({ data: null, loading: false, error: null });
  const [prices, setPrices] = useState({ data: [], loading: false, error: null });
  const [analysis, setAnalysis] = useState({ data: null, loading: false, error: null });
  const [news, setNews] = useState({ data: null, loading: false, error: null });
  const [indicators, setIndicators] = useState({ data: [], loading: false, error: null });
  const [selectedIndicators, setSelectedIndicators] = useState([]);

  const [timeframe, setTimeframe] = useState('6M');
  const [searchValue, setSearchValue] = useState('');
  const searchRef = useRef('');

  // === LOAD SYMBOLS once, also boot with URL ?s=SYMBOL ===
  useEffect(() => {
    const fetchSymbols = async () => {
      try {
        setSymbols({ data: [], loading: true, error: null });
        const res = await axiosClient.get('/symbols');
        setSymbols({ data: res.data, loading: false, error: null });
        const s = searchParams.get('s');
        if (s) setSelectedSymbol(s.toUpperCase());
      } catch (err) {
        console.error('Lỗi khi tải danh sách symbols:', err);
        setSymbols({ data: [], loading: false, error: 'Không tải được danh sách cổ phiếu.' });
      }
    };
    fetchSymbols();
  }, []);

  // === LOAD DETAIL PER SYMBOL — từng phần độc lập, hiển thị ngay ===
  useEffect(() => {
    if (!selectedSymbol) return;

    // Reset từng phần để skeleton hiển thị riêng
    setOverview({ data: null, loading: true, error: null });
    setPrices({ data: [], loading: true, error: null });
    setAnalysis({ data: null, loading: true, error: null });
    setNews({ data: null, loading: true, error: null });
    setIndicators({ data: [], loading: false, error: null });
    // Khi đổi mã thì bỏ chọn indicator (giữ lại nếu bạn muốn)
    // setSelectedIndicators([]);

    let active = true; // tránh race-condition

    axiosClient.get(`/company/${selectedSymbol}/overview`)
      .then((ov) => active && setOverview({ data: ov.data, loading: false, error: null }))
      .catch(() => active && setOverview({ data: null, loading: false, error: 'Lỗi tải thông tin tổng quan.' }));

    axiosClient.get(`/prices/${selectedSymbol}`)
      .then((pr) => active && setPrices({ data: pr.data, loading: false, error: null }))
      .catch(() => active && setPrices({ data: [], loading: false, error: 'Lỗi tải dữ liệu biểu đồ.' }));

    axiosClient.get(`/analyze/${selectedSymbol}`)
      .then((an) => active && setAnalysis({ data: an.data, loading: false, error: null }))
      .catch(() => active && setAnalysis({ data: null, loading: false, error: 'Lỗi tải phân tích AI.' }));

    axiosClient.get(`/company/${selectedSymbol}/news-sentiment`)
      .then((nw) => active && setNews({ data: nw.data, loading: false, error: null }))
      .catch(() => active && setNews({ data: null, loading: false, error: 'Lỗi tải tin tức.' }));

    return () => { active = false; };
  }, [selectedSymbol]);

  // === PRICES derived: cap + timeframe ===
  const cappedPrices = useMemo(() => {
    const arr = Array.isArray(prices.data) ? prices.data : [];
    return arr.slice(-MAX_POINTS);
  }, [prices.data]);

  const filteredPrices = useMemo(() => {
    const arr = Array.isArray(cappedPrices) ? cappedPrices : [];
    // dùng số phiên giao dịch ~ 21 ngày/tháng
    const map = { '3M': 63, '6M': 126, '1Y': 252, 'ALL': Infinity };
    const take = map[timeframe] ?? 126;
    if (!arr.length || take === Infinity) return arr;
    const n = Math.min(take, arr.length);
    return arr.slice(-n);
  }, [cappedPrices, timeframe]);

  const { closes, times, baseHash } = useMemo(() => {
    const c = filteredPrices.map((p) => Number(p.close));
    const t = filteredPrices.map((p) => p.time);
    return { closes: c, times: t, baseHash: hashArr(c) };
  }, [filteredPrices]);

  // === CALC INDICATORS on FE ===
  useEffect(() => {
    if (!selectedSymbol || selectedIndicators.length === 0) {
      setIndicators({ data: [], loading: false, error: null });
      return;
    }
    if (!Array.isArray(filteredPrices) || filteredPrices.length === 0) {
      setIndicators({ data: [], loading: false, error: 'Chưa có dữ liệu giá để tính chỉ báo.' });
      return;
    }

    try {
      setIndicators({ data: [], loading: true, error: null });
      const out = [];
      const pushSeries = (name, arr) => {
        const offset = closes.length - arr.length;
        out.push({ name, data: arr.map((v, i) => ({ time: times[i + offset], value: v })) });
      };

      for (const key of selectedIndicators) {
        const parts = key.split('-');
        const kind = (parts[0] || '').toUpperCase();

        if (kind === 'SMA' || kind === 'EMA' || kind === 'RSI') {
          const period = Number(parts[1] || '0');
          if (!period) continue;
          if (kind === 'SMA') pushSeries(`SMA-${period}`, memoCalc(`SMA-${period}`, baseHash, () => SMA(closes, period)));
          if (kind === 'EMA') pushSeries(`EMA-${period}`, memoCalc(`EMA-${period}`, baseHash, () => EMA(closes, period)));
          if (kind === 'RSI') pushSeries(`RSI-${period}`, memoCalc(`RSI-${period}`, baseHash, () => RSI(closes, period)));
        } else if (kind === 'BB' || kind === 'BBANDS') {
          const period = Number(parts[1] || '20');
          const stdev = Number(parts[2] || '2');
          const bb = memoCalc(`BB-${period}-${stdev}`, baseHash, () => Bollinger(closes, period, stdev));
          pushSeries(`BB-${period}-${stdev}-Middle`, bb.middle);
          pushSeries(`BB-${period}-${stdev}-Upper`, bb.upper);
          pushSeries(`BB-${period}-${stdev}-Lower`, bb.lower);
        } else if (kind === 'MACD') {
          const fast = +parts[1] || 12;
          const slow = +parts[2] || 26;
          const signal = +parts[3] || 9;
          const macd = memoCalc(`MACD-${fast}-${slow}-${signal}`, baseHash, () => MACD(closes, fast, slow, signal));
          out.push({
            name: `MACD-${fast}-${slow}-${signal}`,
            data: macd.macd.map((v, i) => ({ time: times[i + (closes.length - macd.macd.length)], macd: v, signal: macd.signal[i], hist: macd.hist[i] })),
          });
        }
      }

      setIndicators({ data: out, loading: false, error: null });
    } catch (e) {
      console.error('Lỗi tính chỉ báo ở client:', e);
      setIndicators({ data: [], loading: false, error: 'Lỗi tính chỉ báo ở client.' });
    }
  }, [selectedIndicators, selectedSymbol, closes, times, baseHash, filteredPrices]);

  // === SEARCH options + debounce ===
  const searchOptions = useMemo(() => symbols.data.map(item => ({
    value: `${item.symbol} - ${item.name}`,
    label: `${item.symbol} - ${item.name}`,
    symbol: item.symbol,
  })), [symbols.data]);

  useEffect(() => {
    const h = setTimeout(() => { searchRef.current = searchValue; }, 200);
    return () => clearTimeout(h);
  }, [searchValue]);

  // === HANDLERS ===
  const handleSearchSelect = (value, option) => {
    const s = option.symbol.toUpperCase();
    setSelectedSymbol(s);
    setSearchParams({ s });
  };
  const handleIndicatorChange = (checkedValues) => setSelectedIndicators(checkedValues);

  // === Persist selectedIndicators ===
  useEffect(() => {
    const raw = localStorage.getItem('selectedIndicators');
    if (raw) { try { setSelectedIndicators(JSON.parse(raw)); } catch { } }
  }, []);
  useEffect(() => {
    localStorage.setItem('selectedIndicators', JSON.stringify(selectedIndicators));
  }, [selectedIndicators]);

  // === UI ===
  const renderStockDetails = () => {
    const tabItems = [
      {
        key: 'overview',
        label: 'Tổng quan & Phân tích AI',
        children: (
          <Row gutter={[16, 16]} style={{ marginTop: '16px' }}>
            <Col xs={24} lg={16}>
              <Card title="Phân tích từ AI">
                {analysis.loading ? <Skeleton active /> : analysis.error ? <Alert message={analysis.error} type="error" /> : analysis.data && (
                  <>
                    <p><strong>Xu hướng: </strong><Tag color={getTrendColor(analysis.data.trend)}>{analysis.data.trend}</Tag></p>
                    <p><strong>Độ tin cậy: </strong>{(analysis.data.confidence_score * 100).toFixed(0)}%</p>
                    <Paragraph>{analysis.data.summary}</Paragraph>
                  </>
                )}
              </Card>
            </Col>
            <Col xs={24} lg={8}>
              <Card title="Thông tin Cổ phiếu">
                {overview.loading ? <Skeleton active /> : overview.error ? <Alert message={overview.error} type="error" /> : overview.data && (
                  <>
                    <Statistic title="Vốn hóa" value={overview.data.MarketCapitalization} formatter={(value) => value ? `$${(value / 1e9).toFixed(2)}B` : '—'} />
                    <Paragraph ellipsis={{ rows: 5, expandable: true, symbol: 'Xem thêm' }} style={{ marginTop: '16px' }}>
                      {overview.data.Description || '—'}
                    </Paragraph>
                  </>
                )}
              </Card>
            </Col>
          </Row>
        ),
      },
      {
        key: 'news',
        label: 'Tin tức',
        children: (
          <Card style={{ marginTop: '16px' }}>
            {news.loading ? <Skeleton active /> : news.error ? <Alert message={news.error} type="error" /> : news.data && (
              <List
                header={<Title level={5}>{news.data.summary}</Title>}
                dataSource={(news.data.articles || []).slice(0, 10)}
                renderItem={(item) => (
                  <List.Item>
                    <List.Item.Meta
                      title={<Link href={item.url || item.article_url} target="_blank">{item.headline || item.title}</Link>}
                      description={<Text type="secondary">{item.published_utc ? new Date(item.published_utc).toLocaleDateString() : ''}</Text>}
                    />
                  </List.Item>
                )}
              />
            )}
          </Card>
        ),
      },
    ];

    return (
      <>
        <Title level={2} style={{ marginTop: '24px' }}>
          {overview.loading ? <Skeleton.Input active style={{ width: 300 }} /> :
            overview.error ? (selectedSymbol || '').toUpperCase() :
              (overview.data ? `${overview.data.Name} (${overview.data.Symbol})` : (selectedSymbol || '').toUpperCase())
          }
        </Title>
        <Card title="Biểu đồ Giá">
          {prices.loading ? <Skeleton.Button active style={{ height: 400, width: '100%' }} /> : prices.error ? <Alert message={prices.error} type="error" /> : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
                <Segmented options={['3M', '6M', '1Y', 'ALL']} value={timeframe} onChange={setTimeframe} />
              </div>
              <StockChart data={filteredPrices} indicators={indicators.data} height={460} theme="light" />
              <div style={{ marginTop: '16px' }}>
                <Text strong>Các chỉ báo kỹ thuật: </Text>
                <Checkbox.Group
                  options={indicatorOptionsConst}
                  value={selectedIndicators}
                  onChange={handleIndicatorChange}
                  disabled={indicators.loading}
                />
                {indicators.loading && <Spin size="small" style={{ marginLeft: 10 }} />}
                {indicators.error && <Text type="danger" style={{ marginLeft: 10 }}>{indicators.error}</Text>}
              </div>
            </>
          )}
        </Card>
        <Tabs defaultActiveKey="overview" items={tabItems} />
      </>
    );
  };

  return (
    <Layout style={{ minHeight: '100vh' }}>
      <AppHeader />
      <Layout>
        <Content style={{ padding: '0 48px 24px 48px', height: 'calc(100vh - 64px)', overflow: 'auto' }}>
          <div style={{
            position: 'sticky',
            top: 0,
            zIndex: 20,
            background: '#fff',
            padding: '16px 0',
            margin: 0,
            borderBottom: '1px solid #f0f0f0',
          }}>
            <AutoComplete
              style={{ width: '100%' }}
              options={searchOptions}
              onSelect={handleSearchSelect}
              filterOption={(inputValue, option) => {
                const q = (searchRef.current || inputValue || '').toUpperCase();
                return option.label.toUpperCase().includes(q);
              }}
            >
              <Input.Search size="large" placeholder="Nhập mã hoặc tên công ty để bắt đầu phân tích..." loading={symbols.loading} value={searchValue} onChange={(e) => setSearchValue(e.target.value)} />
            </AutoComplete>
            {symbols.error && <Alert message={symbols.error} type="error" style={{ marginTop: '10px' }} />}
          </div>

          {selectedSymbol ? renderStockDetails() : (
            <Card style={{ textAlign: 'center', minHeight: '300px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Text type="secondary">Vui lòng chọn một cổ phiếu để xem phân tích</Text>
            </Card>
          )}
        </Content>
        <Sider width={350} theme="light" style={{ padding: '24px', height: 'calc(100vh - 64px)', overflow: 'auto', borderLeft: '1px solid #f0f0f0' }}>
          <AIChat
            symbols={symbols.data}
            selectedSymbol={selectedSymbol}
            overview={overview.data}
            prices={filteredPrices}
            analysis={analysis.data}
            news={news.data}
            indicators={indicators.data}
            selectedIndicators={selectedIndicators}
          />
        </Sider>
      </Layout>
    </Layout>
  );
};

export default DashboardPage;
