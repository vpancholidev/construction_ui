import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import './ManagePages.css';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { FetchAllEmployees } from '../api/empApi';
import { FetchAllSite } from '../api/siteApi';
import { getAllAttendance, addAttendance, updateAttendance } from '../api/attendanceApi';

function EmployeeAttendance() {
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();

  const [attendances, setAttendances] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [sites, setSites] = useState([]);

  const [modalOpen, setModalOpen] = useState(false);
  const [editing, setEditing] = useState(null);
  const [form, setForm] = useState({ EmployeeId: '', AttendanceDate: '', AttendanceStatus: 'Present', OvertimeHrs: 0, SiteId: '' });

  useEffect(() => {
    if (!orgData?.organisationId) return;
    loadAll();
  }, [orgData]);

  const loadAll = async () => {
    showLoader();
    try {
      const [empRes, siteRes, attRes] = await Promise.all([
        FetchAllEmployees(orgData.organisationId),
        FetchAllSite(),
        getAllAttendance(),
      ]);

  // Normalize employee list (handle wrapped payloads)
  const empRaw = empRes && empRes.data;
  const empList = Array.isArray(empRaw) ? empRaw : (Array.isArray(empRaw?.data) ? empRaw.data : (Array.isArray(empRaw?.result) ? empRaw.result : []));

  // Normalize site list (handle different server shapes: array or { data: [...]} or { sites: [...] })
  const siteRaw = siteRes && siteRes.data;
  const siteList = Array.isArray(siteRaw) ? siteRaw : (Array.isArray(siteRaw?.data) ? siteRaw.data : (Array.isArray(siteRaw?.sites) ? siteRaw.sites : (Array.isArray(siteRaw?.result) ? siteRaw.result : [])));
      const attList = attRes.data || [];

  setEmployees(empList);
  setSites(siteList);

      // normalize attendance response items
      const mapped = (Array.isArray(attList) ? attList : []).map(a => ({
        AttendanceId: a.attendanceId || a.AttendanceId || a.AttendanceId,
        // keep user id so edit form can pre-select employee
        UserId: a.userId || a.UserId || a.userid || a.Userid || a.UserID || a.UserId,
        EmployeeName: a.employeeName || a.EmployeeName || a.EmployeeName,
        AttendanceStatus: a.attendanceStatus || a.AttendanceStatus || a.AttendanceStatus,
        OvertimeHrs: a.overtimeHrs || a.OvertimeHrs || a.OvertimeHrs || 0,
        SiteId: a.siteId || a.SiteId || a.SiteId,
        AttendanceDate: a.attendanceDate || a.AttendanceDate || (a.attendanceDate ? a.attendanceDate : ''),
      }));

      setAttendances(mapped);
    } catch (err) {
      console.error('load attendance error', err);
    } finally {
      hideLoader();
    }
  };

  const openAdd = () => { setEditing(null); setForm({ EmployeeId: '', AttendanceDate: '', AttendanceStatus: 'Present', OvertimeHrs: 0, SiteId: '' }); setModalOpen(true); };
  const openEdit = (it) => {
    setEditing(it);
    const uid = it.UserId || it.userId || it.userid || it.Userid || '';
    setForm({ EmployeeId: uid, AttendanceDate: it.AttendanceDate || '', AttendanceStatus: it.AttendanceStatus || 'Present', OvertimeHrs: it.OvertimeHrs || 0, SiteId: it.SiteId || '' });
    setModalOpen(true);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      const payload = {
        AttendanceId: editing?.AttendanceId || undefined,
        UserId: form.EmployeeId,
        AttendanceDate: form.AttendanceDate,
        AttendanceStatus: form.AttendanceStatus,
        OvertimeHrs: Number(form.OvertimeHrs) || 0,
        SiteId: form.SiteId,
        OrganisationId: orgData.organisationId,
        EmployeeName : employees.find(emp => (emp.userid || emp.Userid || emp.UserId) == form.EmployeeId) ? `${employees.find(emp => (emp.userid || emp.Userid || emp.UserId) == form.EmployeeId).firstname || employees.find(emp => (emp.userid || emp.Userid || emp.UserId) == form.EmployeeId).Firstname} ${employees.find(emp => (emp.userid || emp.Userid || emp.UserId) == form.EmployeeId).lastName || employees.find(emp => (emp.userid || emp.Userid || emp.UserId) == form.EmployeeId).Lastname || ''}` : ''
      };

      if (editing && editing.AttendanceId) {
        await updateAttendance(payload);
      } else {
        await addAttendance(payload);
      }

      await loadAll();
      setModalOpen(false);
    } catch (err) {
      console.error('save attendance', err);
    } finally {
      hideLoader();
    }
  };

  const handleChange = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>Employee Attendance</h2>
          <div><button className="btn" onClick={openAdd}>Add Attendance</button></div>
        </div>

        <div className="list">
          <table>
            <thead>
              <tr>
                <th>Employee</th>
                <th>Date</th>
                <th>Status</th>
                <th>Overtime</th>
                <th>Site</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {attendances.map(a => (
                <tr key={a.AttendanceId || (a.UserId + a.AttendanceDate)}>
                  <td>{a.EmployeeName}</td>
                  <td>{a.AttendanceDate}</td>
                  <td>{a.AttendanceStatus}</td>
                  <td>{a.OvertimeHrs}</td>
                  <td>{(sites.find(s => (s.siteid || s.siteId || s.id) == a.SiteId)?.sitename) || (sites.find(s => (s.siteid || s.siteId || s.id) == a.SiteId)?.siteName) || ''}</td>
                  <td><button className="btn small" onClick={() => openEdit(a)}>Edit</button></td>
                </tr>
              ))}
              {attendances.length === 0 && <tr><td colSpan={6}>No attendance records</td></tr>}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editing ? 'Edit' : 'Add'} Attendance</h3>
              <form onSubmit={handleSubmit}>
                <label>Employee</label>
                <select value={form.EmployeeId} onChange={e => handleChange('EmployeeId', e.target.value)} required>
                  <option value="">-- select --</option>
                  {employees.map(emp => (
                    <option key={emp.userid || emp.Userid || emp.UserId} value={emp.userid || emp.Userid || emp.UserId}>{`${emp.firstname || emp.Firstname} ${emp.lastName || emp.Lastname || ''}`}</option>
                  ))}
                </select>
                  {/* <div className="field">
                    <label>Employee</label>
                    <select value={form.EmployeeId} onChange={e => handleChange('EmployeeId', e.target.value)} required>
                      <option value="">-- select --</option>
                      {employees.map(emp => (
                        <option key={emp.userid || emp.Userid || emp.UserId} value={emp.userid || emp.Userid || emp.UserId}>{`${emp.firstname || emp.Firstname} ${emp.lastName || emp.Lastname || ''}`}</option>
                      ))}
                    </select>
                  </div> */}

                <label>Date</label>
                <input type="date" value={form.AttendanceDate} onChange={e => handleChange('AttendanceDate', e.target.value)} required />
                  {/* <div className="field">
                    <label>Date</label>
                    <input type="date" value={form.AttendanceDate} onChange={e => handleChange('AttendanceDate', e.target.value)} required />
                  </div> */}

                <label>Status</label>
                <select value={form.AttendanceStatus} onChange={e => handleChange('AttendanceStatus', e.target.value)}>
                  <option>Full</option>
                  <option>Half</option>
                  <option>Absent</option>
                </select>
                  {/* <div className="field">
                    <label>Status</label>
                    <select value={form.AttendanceStatus} onChange={e => handleChange('AttendanceStatus', e.target.value)}>
                      <option>Full</option>
                      <option>Half</option>
                      <option>Absent</option>
                    </select>
                  </div> */}

                <label>Overtime</label>
                <input type="number" value={form.OvertimeHrs} onChange={e => handleChange('OvertimeHrs', e.target.value)} />
                  {/* <div className="field">
                    <label>Overtime</label>
                    <input type="number" value={form.OvertimeHrs} onChange={e => handleChange('OvertimeHrs', e.target.value)} />
                  </div> */}

                <label>Site</label>
                <select value={form.SiteId} onChange={e => handleChange('SiteId', e.target.value)}>
                  <option value="">-- select --</option>
                  {sites.map(s => (
                    <option key={s.siteId || s.siteId || s.id} value={s.siteId || s.siteId || s.id}>{s.sitename || s.siteName || s.Sitename}</option>
                  ))}
                </select>
                  {/* <div className="field">
                    <label>Site</label>
                    <select value={form.SiteId} onChange={e => handleChange('SiteId', e.target.value)}>
                      <option value="">-- select --</option>
                      {sites.map(s => (
                        <option key={s.siteId || s.siteId || s.id} value={s.siteId || s.siteId || s.id}>{s.sitename || s.siteName || s.Sitename}</option>
                      ))}
                    </select>
                  </div> */}

                <div className="modal-actions">
                  <button type="submit" className="btn">{editing ? 'Update' : 'Add'}</button>
                  <button type="button" className="btn" onClick={() => setModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default EmployeeAttendance;
