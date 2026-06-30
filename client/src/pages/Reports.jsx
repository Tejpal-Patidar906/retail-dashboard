import { useState } from 'react';
import Layout from '../components/layout/Layout';
import Button from '../components/ui/Button';
import Badge from '../components/ui/Badge';
import { FileText, Download, FileSpreadsheet, Users, Clock, CheckCircle } from 'lucide-react';
import api from '../services/api';
import toast from 'react-hot-toast';

const recentReports = [
  { name: 'Sales Report',     format: 'PDF', date: 'Today 10:30',    status: 'ready' },
  { name: 'Inventory Export', format: 'CSV', date: 'Today 09:15',    status: 'ready' },
  { name: 'Customer Insights',format: 'PDF', date: 'Yesterday 17:45',status: 'ready' },
  { name: 'Sales Report',     format: 'PDF', date: '2 days ago',      status: 'ready' },
];

const Reports = () => {
  const [loading, setLoading] = useState({});

  const downloadReport = async (endpoint, filename, type) => {
    setLoading(l => ({ ...l, [endpoint]: true }));
    try {
      const response = await api.get(`/reports/${endpoint}`, { responseType: 'blob' });
      const blob = new Blob([response.data], {
        type: type === 'csv' ? 'text/csv' : 'application/pdf',
      });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      a.click();
      window.URL.revokeObjectURL(url);
      toast.success(`${filename} downloaded!`);
    } catch {
      toast.error('Failed to generate report');
    } finally {
      setLoading(l => ({ ...l, [endpoint]: false }));
    }
  };

  const reportButtons = [
    {
      id: 'sales-pdf',
      endpoint: 'sales-pdf',
      filename: 'sales-report.pdf',
      type: 'pdf',
      name: 'Sales Report',
      desc: 'Last 30 days — revenue, profit, transactions table',
      icon: FileText,
      color: 'accent',
      format: 'PDF',
    },
    {
      id: 'inventory-csv',
      endpoint: 'inventory-csv',
      filename: 'inventory-report.csv',
      type: 'csv',
      name: 'Inventory Export',
      desc: 'All products with stock levels and pricing',
      icon: FileSpreadsheet,
      color: 'green',
      format: 'CSV',
    },
    {
      id: 'customers-pdf',
      endpoint: 'customers-pdf',
      filename: 'customers-report.pdf',
      type: 'pdf',
      name: 'Customer Insights',
      desc: 'Segment breakdown, LTV, and visit history',
      icon: Users,
      color: 'purple',
      format: 'PDF',
    },
  ];

  const formatColor = { PDF: 'red', CSV: 'green' };

  return (
    <Layout title="Reports" subtitle="Generate and download analytics reports">
      <div className="grid chart-grid-3">
        {/* Generate Reports */}
        <div className="card">
          <div className="card-header">
            <div>
              <div className="card-title">Generate Reports</div>
              <div className="card-subtitle">Export data as PDF or CSV</div>
            </div>
          </div>

          <div className="report-btn-group">
            {reportButtons.map(report => (
              <div key={report.id} className="report-item" id={`report-${report.id}`}>
                <div className={`report-icon kpi-icon ${report.color}`}>
                  <report.icon size={20} />
                </div>
                <div className="report-info">
                  <div className="report-name">{report.name}</div>
                  <div className="report-desc">{report.desc}</div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: 6 }}>
                  <Badge color={formatColor[report.format]}>{report.format}</Badge>
                  <Button
                    size="sm"
                    variant="secondary"
                    icon={Download}
                    loading={loading[report.endpoint]}
                    onClick={() => downloadReport(report.endpoint, report.filename, report.type)}
                    id={`download-${report.id}`}
                  >
                    Download
                  </Button>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Reports */}
        <div className="card">
          <div className="card-header">
            <div className="card-title">Recent Reports</div>
            <div className="card-subtitle">Previously generated files</div>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
            {recentReports.map((report, idx) => (
              <div
                key={idx}
                style={{
                  display: 'flex', alignItems: 'center', gap: 12,
                  padding: '12px 0',
                  borderBottom: idx < recentReports.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                <div style={{
                  width: 36, height: 36,
                  background: report.format === 'PDF' ? 'rgba(240,97,107,0.15)' : 'rgba(52,217,158,0.15)',
                  borderRadius: 8,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  color: report.format === 'PDF' ? 'var(--red)' : 'var(--green)',
                  flexShrink: 0,
                }}>
                  {report.format === 'PDF' ? <FileText size={16} /> : <FileSpreadsheet size={16} />}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text)' }}>{report.name}</div>
                  <div style={{ fontSize: '0.72rem', color: 'var(--muted2)', display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
                    <Clock size={10} />
                    {report.date}
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Badge color={formatColor[report.format]}>{report.format}</Badge>
                  <CheckCircle size={14} color="var(--green)" />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </Layout>
  );
};

export default Reports;
