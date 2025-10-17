import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import './ManagePages.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';
import { addLabourPayment, getAllLabourPayments, updateLabourPayment, getLabourData } from '../api/labourApi';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';

export default function LabourPayment() {
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();
  const [payments, setPayments] = useState([]);
  const [search, setSearch] = useState('');
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);
  const [form, setForm] = useState({ LabourPaymentId: '', EmployeeId: '', Amount: '', PaymentDate: '', PaymentPeriodStartDate: '', PaymentPeriodEndDate: '', SiteId: '', Notes: '' });
  const [editing, setEditing] = useState(false);
  const [showModal, setShowModal] = useState(false);

  const loadLookups = async () => {
    try {
      showLoader();
      const resp = await getLabourData(orgData?.organisationId);
  const data = resp.data || {};
  // debug: show raw labour data response
  console.debug('GetLabourData response', data);
  const emps = data.Employees || data.employees || [];
  const sts = data.Sites || data.sites || [];
  setEmployees(emps);
  setSites(sts);
  return { employees: emps, sites: sts };
    } catch (err) {
      console.error('Lookup load error', err);
      toast.error('Failed to load employees or sites');
    } finally { hideLoader(); }
  };

  // helper to normalize a server payment item into UI shape (includes UserId and resolved names)
  const mapPayment = (item, empList = employees, siteList = sites) => {
    const labourPaymentId = item.labourPaymentId || item.LabourPaymentId || item.LabourPaymentId;
    const amount = item.amount ?? item.Amount;
    const paymentDate = item.paymentDate || item.createdDate || item.PaymentDate;
    const paymentPeriodStartDate = item.paymentPeriodStartDate || item.PaymentPeriodStartDate || item.paymentPeriodStartDate;
    const paymentPeriodEndDate = item.paymentPeriodEndDate || item.PaymentPeriodEndDate || item.paymentPeriodEndDate;
    const siteId = item.siteId || item.SiteId || item.SiteID;
    const userId = item.userId || item.Userid || item.UserId || item.EmployeeId || item.employeeId;
    const notes = item.notes || item.Notes || '';

    const emp = empList.find(e => {
      const id = e.Userid || e.userid || e.id || e.employeeId;
      return id && userId && id.toString() === userId.toString();
    });

    // primary: employee record match
    let employeeName = emp ? `${emp.Firstname || emp.firstname || ''} ${emp.Lastname || emp.lastname || ''}`.trim() : '';
    // secondary: server-provided employeeName fields
    if (!employeeName) employeeName = item.employeeName || item.EmployeeName || item.firstname || item.Firstname || '';

    const site = siteList.find(s => {
      const id = s.SiteId || s.siteId || s.id;
      return id && siteId && id.toString() === siteId.toString();
    });
    const siteName = site ? (site.Sitename || site.sitename || site.name || '') : (item.siteName || item.SiteName || '');

    // If still no employeeName, try site owner fields (SiteResponseModel may include firstname/lastname)
    if (!employeeName) {
      if (site) {
        employeeName = (site.firstname || site.Firstname || site.firstname || '') + ' ' + (site.lastname || site.Lastname || site.lastname || '');
        employeeName = employeeName.trim();
      }
      // fallback to empty string
      if (!employeeName) employeeName = '';
    }

    return {
      LabourPaymentId: labourPaymentId,
      UserId: userId,
      EmployeeId: userId,
      EmployeeName: employeeName,
      Amount: amount,
      PaymentDate: paymentDate,
      PaymentPeriodStartDate: paymentPeriodStartDate,
      PaymentPeriodEndDate: paymentPeriodEndDate,
      SiteId: siteId,
      SiteName: siteName,
      Notes: notes,
      raw: item
    };
  };

  const loadPayments = async (lookups) => {
    try {
      showLoader();
      const resp = await getAllLabourPayments(orgData?.organisationId);
      const raw = resp.data || [];
      // use lookups passed in (fresh) or the state ones
      const empList = (lookups && (lookups.employees || lookups.Employees)) ? (lookups.employees || lookups.Employees) : employees;
      const siteList = (lookups && (lookups.sites || lookups.Sites)) ? (lookups.sites || lookups.Sites) : sites;

      // normalize server response fields using shared mapPayment helper
      const mapped = raw.map(item => mapPayment(item, empList, siteList));
      setPayments(mapped);
      console.log('Loaded payments', mapped);
    } catch (err) {
      console.error('Load payments error', err);
    } finally { hideLoader(); }
  };

  useEffect(() => {
    if (!orgData?.organisationId) return;
    // ensure lookups are loaded before mapping payments so we can resolve names
    (async () => {
      const lookups = await loadLookups();
      await loadPayments(lookups);
    })();
  }, [orgData]);

  const openAdd = () => { setForm({ LabourPaymentId: '', EmployeeId: '', Amount: '', PaymentDate: '', PaymentPeriodStartDate: '', PaymentPeriodEndDate: '', SiteId: '', Notes: '' }); setEditing(false); setShowModal(true); };
  const openEdit = (p) => {
    setForm({
      LabourPaymentId: p.LabourPaymentId,
      EmployeeId: p.EmployeeId || '',
      Amount: p.Amount,
      PaymentDate: p.PaymentDate ? new Date(p.PaymentDate).toISOString().slice(0,10) : '',
      PaymentPeriodStartDate: p.PaymentPeriodStartDate ? new Date(p.PaymentPeriodStartDate).toISOString().slice(0,10) : '',
      PaymentPeriodEndDate: p.PaymentPeriodEndDate ? new Date(p.PaymentPeriodEndDate).toISOString().slice(0,10) : '',
      SiteId: p.SiteId,
      Notes: p.Notes || ''
    });
    setEditing(true);
    setShowModal(true);
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm(prev => ({ ...prev, [name]: value }));

    // if employee changed, auto-fill amount from wageperday when available
    if (name === 'EmployeeId') {
      const emp = employees.find(x => {
        const id = x.Userid || x.userid || x.id || x.employeeId;
        return id && id.toString() === value.toString();
      });
      if (emp) {
        const wage = emp.Wageperday || emp.wageperday || emp.WagePerDay || emp.wagePerDay || emp.wagePerDay || emp.wagePerDay;
        setForm(prev => ({ ...prev, Amount: wage != null ? String(wage) : prev.Amount, EmployeeId: value }));
      }
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    // validations
    if (!form.EmployeeId) return toast.error('Employee required');
    if (!form.Amount) return toast.error('Amount required');
    if (!form.PaymentPeriodStartDate || !form.PaymentPeriodEndDate) return toast.error('Period required');
    if (!form.SiteId) return toast.error('Site required');

    const payload = {
      LabourPaymentId: form.LabourPaymentId || undefined,
      UserId: form.EmployeeId,
      Amount: parseFloat(form.Amount),
      PaymentDate: form.PaymentDate || undefined,
      Notes: form.Notes,
      SiteId: form.SiteId,
      PaymentPeriodStartDate: form.PaymentPeriodStartDate,
      PaymentPeriodEndDate: form.PaymentPeriodEndDate,
      OrganisationId: orgData?.organisationId
    };

    try {
      showLoader();
      const resp = editing && form.LabourPaymentId
        ? await updateLabourPayment(form.LabourPaymentId, payload)
        : await addLabourPayment(payload);
      const respData = resp?.data;

      if (respData) {
        const mappedResp = mapPayment(respData);
        if (editing) {
          setPayments(prev => prev.map(p => (p.LabourPaymentId === mappedResp.LabourPaymentId ? mappedResp : p)));
          toast.success('Payment updated');
        } else {
          setPayments(prev => [mappedResp, ...prev]);
          toast.success('Payment added');
        }
      } else {
        // fallback to reload when server doesn't return the created/updated object
        if (editing) toast.success('Payment updated'); else toast.success('Payment added');
        await loadPayments();
      }
      setShowModal(false);
    } catch (err) {
      console.error('Save error', err);
      toast.error('Failed to save payment');
    } finally { hideLoader(); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <ToastContainer position="top-center" autoClose={3000} />
        <h2>Labour Payments</h2>
        <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 12 }}>
          <button onClick={openAdd}>+ Add Payment</button>
          <div style={{ marginLeft: 'auto' }}>
            <input
              placeholder="Search employee..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              style={{ padding: '8px 10px', borderRadius: 6, border: '1px solid #ddd' }}
            />
          </div>
        </div>

        <table className="list">
          <thead>
            <tr>
              <th>Employee</th>
              <th>Amount</th>
              <th>Payment Date</th>
              <th>Period</th>
              <th>Site</th>
              <th>Notes</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payments
              .filter(p => !search || (p.EmployeeName || '').toLowerCase().includes(search.toLowerCase()))
              .map(p => (
              <tr key={p.LabourPaymentId}>
                <td>{p.EmployeeName || ''}</td>
                <td>{p.Amount}</td>
                <td>{p.PaymentDate ? new Date(p.PaymentDate).toLocaleDateString() : ''}</td>
                <td>{p.PaymentPeriodStartDate ? new Date(p.PaymentPeriodStartDate).toLocaleDateString() : ''} - {p.PaymentPeriodEndDate ? new Date(p.PaymentPeriodEndDate).toLocaleDateString() : ''}</td>
                <td>{p.SiteName || ''}</td>
                <td>{p.Notes}</td>
                <td><button onClick={() => openEdit(p)}>Edit</button></td>
              </tr>
            ))}
          </tbody>
        </table>

        {showModal && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editing ? 'Edit Payment' : 'Add Payment'}</h3>
              <form onSubmit={handleSubmit} className="simple-form">
                <label>Employee</label>
                <select name="EmployeeId" value={form.EmployeeId} onChange={handleChange}>
                  <option value="">Select employee</option>
                  {employees.map(emp => {
                    const id = emp.Userid || emp.userid || emp.id || emp.employeeId;
                    const fn = emp.Firstname || emp.firstname || emp.firstName || '';
                    const ln = emp.Lastname || emp.lastname || emp.lastName || '';
                    return <option key={id} value={id}>{fn} {ln}</option>;
                  })}
                </select>

                <label>Amount</label>
                <input name="Amount" value={form.Amount} onChange={handleChange} />

                <label>Payment Date</label>
                <input type="date" name="PaymentDate" value={form.PaymentDate} onChange={handleChange} />

                <label>Period Start</label>
                <input type="date" name="PaymentPeriodStartDate" value={form.PaymentPeriodStartDate} onChange={handleChange} />

                <label>Period End</label>
                <input type="date" name="PaymentPeriodEndDate" value={form.PaymentPeriodEndDate} onChange={handleChange} />

                <label>Site</label>
                <select name="SiteId" value={form.SiteId} onChange={handleChange}>
                  <option value="">Select site</option>
                  {sites.map(s => {
                    // Bind explicitly to SiteId and Sitename according to GetLabourData response
                    const id = s.SiteId || s.siteId || s.id;
                    const name = s.Sitename || s.sitename || s.name || (s.location ? `${s.location}` : '');
                    return <option key={id} value={id}>{name}</option>;
                  })}
                </select>

                <label>Notes</label>
                <textarea name="Notes" value={form.Notes} onChange={handleChange} />

                <div className="modal-actions">
                  <button type="submit">{editing ? 'Update' : 'Add'}</button>
                  <button type="button" onClick={() => setShowModal(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
