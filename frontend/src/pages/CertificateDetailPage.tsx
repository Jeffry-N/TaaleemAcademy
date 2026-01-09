import { useSearchParams } from 'react-router-dom';
import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { Award, Download, Share2, Shield, CheckCircle } from 'lucide-react';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { fetchCertificateById, fetchCourseById } from '../api/taaleem';
import { useAuth } from '../context/AuthContext';

export const CertificateDetailPage = () => {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const certificateId = parseInt(searchParams.get('id') || '0', 10);

  const { data: certificate, isLoading, error } = useQuery({
    queryKey: ['certificate', certificateId],
    queryFn: () => fetchCertificateById(certificateId),
    enabled: certificateId > 0,
  });

  const { data: course } = useQuery({
    queryKey: ['course', certificate?.courseId],
    queryFn: () => fetchCourseById(certificate?.courseId ?? 0),
    enabled: !!certificate?.courseId,
  });

  const handleDownload = () => {
    if (!certificate) return;
    const token = localStorage.getItem('taaleem-auth');
    const authData = token ? JSON.parse(token) : null;
    
    // Create download link
    const apiUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5194/api';
    const url = `${apiUrl}/Certificate/${certificate.id}/download`;
    
    // Fetch the HTML certificate and open in new window for printing/PDF
    fetch(url, {
      headers: {
        'Authorization': `Bearer ${authData?.token}`
      }
    })
      .then(response => response.text())
      .then(html => {
        const printWindow = window.open('', '_blank');
        if (printWindow) {
          printWindow.document.write(html);
          printWindow.document.close();
          // Trigger print dialog after a short delay
          setTimeout(() => {
            printWindow.focus();
            printWindow.print();
          }, 250);
        }
      })
      .catch(err => {
        console.error('Download failed:', err);
        alert('Failed to generate certificate. Please try again.');
      });
  };
  const handleShare = () => alert('Share options opened!');

  const completionDate = certificate?.generatedAt ? new Date(certificate.generatedAt).toLocaleDateString() : 'N/A';

  if (isLoading) return <AppShell><Spinner /></AppShell>;
  if (error) return <AppShell><ErrorBanner message="Failed to load certificate" /></AppShell>;
  if (!certificate) return <AppShell><ErrorBanner message="Certificate not found" /></AppShell>;

  return (
    <AppShell>
      <div className="min-h-[80vh] bg-gray-50">
        <div className="mx-auto max-w-6xl">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
              <Award className="h-8 w-8 text-green-600" />
            </div>
            <h1 className="mb-2 text-4xl font-bold text-gray-900">Congratulations! 🎉</h1>
            <p className="text-lg text-gray-600">You've successfully completed the course</p>
          </div>

          <div className="relative mb-8 overflow-hidden rounded-2xl border-8 border-blue-600 bg-white p-12 shadow-2xl">
            <div className="absolute top-0 left-0 h-32 w-32 -translate-x-16 -translate-y-16 rounded-full bg-blue-100 opacity-50" />
            <div className="absolute bottom-0 right-0 h-32 w-32 translate-x-16 translate-y-16 rounded-full bg-indigo-100 opacity-50" />
            <div className="relative text-center text-gray-900">
              <p className="text-sm font-semibold uppercase tracking-[0.25em] text-gray-500">Certificate of Completion</p>
              <h2 className="mt-3 text-3xl font-bold">{course?.title || 'Course'}</h2>
              <p className="mt-4 text-lg text-gray-600">This is to certify that</p>
              <p className="mt-2 text-4xl font-extrabold text-blue-700">{user?.fullName}</p>
              <p className="mt-2 text-gray-600">has successfully completed the course requirements.</p>
              <div className="mt-6 grid grid-cols-1 gap-4 text-left md:grid-cols-3">
                <div>
                  <p className="text-xs uppercase text-gray-500">Instructor</p>
                  <p className="text-lg font-semibold">{course?.title}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Completion Date</p>
                  <p className="text-lg font-semibold">{completionDate}</p>
                </div>
                <div>
                  <p className="text-xs uppercase text-gray-500">Certificate ID</p>
                  <p className="text-lg font-semibold">CERT-{certificate.id}</p>
                </div>
              </div>
            </div>
          </div>

          <div className="mb-8 flex flex-col justify-center gap-4 sm:flex-row">
            <button onClick={handleDownload} className="flex items-center justify-center space-x-2 rounded-xl bg-blue-600 px-8 py-4 font-semibold text-white shadow hover:bg-blue-700">
              <Download className="h-5 w-5" />
              <span>Download PDF</span>
            </button>
            <button onClick={handleShare} className="flex items-center justify-center space-x-2 rounded-xl border-2 border-gray-300 bg-white px-8 py-4 font-semibold text-gray-700 hover:bg-gray-50">
              <Share2 className="h-5 w-5" />
              <span>Share</span>
            </button>
          </div>

          <div className="mb-8 rounded-xl border border-gray-100 bg-white p-6 shadow-sm">
            <h3 className="mb-4 text-xl font-bold text-gray-900">Course achievement summary</h3>
            <div className="grid grid-cols-1 gap-6 md:grid-cols-4">
              <SummaryItem label="Status" value="Completed" />
              <SummaryItem label="Date Issued" value={completionDate} />
              <SummaryItem label="Certificate ID" value={`CERT-${certificate.id}`} />
              <SummaryItem label="Verified" value="Yes" />
            </div>
          </div>

          <div className="rounded-xl border border-blue-200 bg-blue-50 p-6">
            <div className="flex items-start space-x-4">
              <Shield className="h-6 w-6 text-blue-600" />
              <div>
                <h4 className="text-lg font-semibold text-gray-900">Verification</h4>
                <p className="text-sm text-gray-700">Use certificate ID CERT-{certificate.id} to verify authenticity.</p>
                <div className="mt-2 inline-flex items-center space-x-2 rounded-full bg-white px-3 py-1 text-sm font-semibold text-blue-700">
                  <CheckCircle className="h-4 w-4" />
                  <span>Ready for verification</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  );
};

const SummaryItem = ({ label, value }: { label: string; value: string }) => (
  <div className="rounded-lg border border-gray-100 bg-gray-50 p-4 text-center">
    <p className="text-xs uppercase text-gray-500">{label}</p>
    <p className="mt-2 text-xl font-bold text-gray-900">{value}</p>
  </div>
);
