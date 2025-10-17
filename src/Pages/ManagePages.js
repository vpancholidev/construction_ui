import React, { useEffect, useState, useRef } from 'react';
import Navbar from '../Component/Navbar';
import { useLoader } from '../Context/LoaderContext';
import { useOrg } from '../Context/OrgContext';
import { getAllPages, addPage, updatePage } from '../api/roleApi';
import { useNavigate } from 'react-router-dom';
import './ManagePages.css';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

export default function ManagePages() {
  const [pageName, setPageName] = useState('');
  const [pages, setPages] = useState([]);
  const [editing, setEditing] = useState(null);
  const { showLoader, hideLoader } = useLoader();
  const { orgData } = useOrg();
  const navigate = useNavigate();

  const fetchPages = async () => {
    showLoader();
    try {
      const orgId = orgData?.organisationId;
      if (!orgId) return setPages([]);
      const resp = await getAllPages(orgId);
      setPages(resp.data || []);
    } catch (err) {
      toast.error('Failed to fetch pages');
    } finally { hideLoader(); }
  };

  const lastFetchedOrgRef = useRef(null);
  useEffect(() => {
    const orgId = orgData?.organisationId;
    if (!orgId) return;
    if (lastFetchedOrgRef.current === orgId) return;
    lastFetchedOrgRef.current = orgId;
    fetchPages();
  }, [orgData]);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!pageName) return toast.error('Page name required');
    showLoader();
    try {
      if (editing) {
        await updatePage({ pageId: editing, pageName: pageName, organisationId: orgData?.organisationId });
        toast.success('Page updated');
        setEditing(null);
      } else {
        await addPage({ pageName: pageName, organisationId: orgData?.organisationId });
        toast.success('Page added');
      }
      setPageName('');
      await fetchPages();
    } catch (err) { toast.error('Failed to add page'); } finally { hideLoader(); }
  };

  return (
    <>
      <Navbar />
      <div className="page-container">
        <ToastContainer position="top-center" autoClose={3000} />
        <h2>Manage Pages</h2>
        <form onSubmit={handleAdd} className="simple-form">
          <input value={pageName} onChange={e => setPageName(e.target.value)} placeholder="Page name" />
          <button type="submit">{editing ? 'Update' : 'Add'}</button>
          {editing && <button type="button" className="btn-secondary" onClick={() => { setEditing(null); setPageName(''); }}>Cancel</button>}
        </form>
        <ul className="list">
          {pages.map(p => (
            <li key={p.pageId || p.pageid || p.id}>
              <span>{p.pageName || p.pagename || p.name}</span>
              <div>
                <button onClick={() => { setEditing(p.pageId || p.pageid || p.id); setPageName(p.pageName || p.pagename || p.name); }}>Edit</button>
              </div>
            </li>
          ))}
        </ul>
        <div style={{ marginTop: 12 }}>
          <button onClick={() => navigate(-1)} className="btn-secondary">Back</button>
        </div>
      </div>
    </>
  );
}
