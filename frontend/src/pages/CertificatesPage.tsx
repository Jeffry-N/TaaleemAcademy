import { useQuery } from '@tanstack/react-query';
import { AppShell } from '../components/AppShell';
import { fetchCertificates, fetchCourses, createCertificate } from '../api/taaleem';
import { Spinner } from '../components/Spinner';
import { ErrorBanner } from '../components/ErrorBanner';
import { useAuth } from '../context/AuthContext';
import { useMutation } from '@tanstack/react-query';
import { useState } from 'react';

export const CertificatesPage = () => {
  const { user } = useAuth();
  const { data: certificates, isLoading, error } = useQuery({ queryKey: ['certificates'], queryFn: fetchCertificates });
  const { data: courses } = useQuery({ queryKey: ['courses'], queryFn: fetchCourses });
  const issueMut = useMutation({ mutationFn: createCertificate });
  const canIssue = user?.role === 'Admin' || user?.role === 'Instructor';

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50"><Spinner /></div>
    );
  }

  if (error) return <ErrorBanner message={(error as any).message ?? 'Failed to load certificates'} />;

  const courseName = (courseId: number) => courses?.find(c => c.id === courseId)?.title ?? `Course #${courseId}`;

  return (
    <AppShell>
      <div className="mx-auto max-w-5xl">
        <h1 className="mb-6 text-2xl font-bold text-gray-900">Certificates</h1>
        {canIssue && (
          <div className="mb-6 rounded-lg border border-gray-200 bg-white p-4">
            <div className="mb-2 text-lg font-semibold">Issue Certificate</div>
            <IssueCertificateForm onIssue={(payload)=>issueMut.mutate(payload)} />
          </div>
        )}
        {!certificates?.length ? (
          <div className="rounded-lg border border-gray-200 bg-white p-6 text-gray-600">No certificates yet.</div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2">
            {certificates.map((c) => (
              <div key={c.id} className="rounded-lg border border-gray-200 bg-white p-4">
                <div className="text-sm text-gray-500">Certificate Code</div>
                <div className="mb-2 text-lg font-semibold">{c.certificateCode}</div>
                <div className="text-gray-700">{courseName(c.courseId)}</div>
                <div className="text-sm text-gray-500">Issued: {new Date(c.generatedAt).toLocaleString()}</div>
                {c.downloadUrl ? (
                  <a href={c.downloadUrl} className="mt-3 inline-block rounded-md bg-blue-600 px-3 py-2 text-white hover:bg-blue-700">Download PDF</a>
                ) : (
                  <div className="mt-3 text-sm text-gray-500">No download available</div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </AppShell>
  );
};

type IssueForm = { courseId: number; userId: number; downloadUrl: string };
const IssueCertificateForm = ({ onIssue }: { onIssue: (payload: any)=>void }) => {
  const [form, setForm] = useState<IssueForm>({ courseId: 0, userId: 0, downloadUrl: '' });
  const [issuedBy, setIssuedBy] = useState<number | null>(null);

  // Simple code generator
  const genCode = () => 'CERT-' + Math.random().toString(36).slice(2, 8).toUpperCase();

  return (
    <div className="grid gap-3 sm:grid-cols-5">
      <input type="number" className="rounded border border-gray-300 p-2" placeholder="Course ID" value={form.courseId} onChange={e=>setForm((f:IssueForm)=>({...f,courseId:parseInt(e.target.value||'0',10)}))} />
      <input type="number" className="rounded border border-gray-300 p-2" placeholder="User ID" value={form.userId} onChange={e=>setForm((f:IssueForm)=>({...f,userId:parseInt(e.target.value||'0',10)}))} />
      <input className="rounded border border-gray-300 p-2 sm:col-span-2" placeholder="Download URL (optional)" value={form.downloadUrl} onChange={e=>setForm((f:IssueForm)=>({...f,downloadUrl:e.target.value}))} />
      <input type="number" className="rounded border border-gray-300 p-2" placeholder="Issued By (Admin/Instructor ID)" value={issuedBy ?? ''} onChange={e=>setIssuedBy(parseInt(e.target.value||'0',10))} />
      <div className="sm:col-span-5">
        <button onClick={()=>{ if(!form.courseId || !form.userId || !issuedBy) return; onIssue({ ...form, issuedBy, certificateCode: genCode() }); }} className="rounded-md bg-blue-600 px-4 py-2 text-white hover:bg-blue-700">Issue</button>
      </div>
    </div>
  );
};
