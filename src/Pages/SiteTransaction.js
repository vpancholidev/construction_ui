import React, { useEffect, useState } from 'react';
import Navbar from '../Component/Navbar';
import './ManagePages.css';
import { useLoader } from '../Context/LoaderContext';
import { getAllTransactions, addTransaction, updateTransaction, getExpenseCategories, addExpenseCategory, updateExpenseCategory } from '../api/siteTransactionApi';
import { FetchAllSite } from '../api/siteApi';

function SiteTransaction() {
  const { showLoader, hideLoader } = useLoader();
  const [transactions, setTransactions] = useState([]);
  const [categories, setCategories] = useState([]);
  const [sites, setSites] = useState([]);
  // filters
  const [filterType, setFilterType] = useState('');
  const [filterSource, setFilterSource] = useState('');
  const [filterFrom, setFilterFrom] = useState('');
  const [filterTo, setFilterTo] = useState('');

  const [catModalOpen, setCatModalOpen] = useState(false);
  const [txnModalOpen, setTxnModalOpen] = useState(false);
  const [editingTxn, setEditingTxn] = useState(null);
  const [editingCat, setEditingCat] = useState(null);

  const [catForm, setCatForm] = useState({ ExpenseCategoryId: '', ExpenseCategoryName: '' });
  const [txnForm, setTxnForm] = useState({ SiteTransactionId: '', ExpenseCategoryId: '', SourceType: '', TransactionDate: '', Notes: '', Amount: 0, ExpenseDescription: '', TransactionType: 'DEBIT' });

  useEffect(() => { loadAll(); }, []);

  const loadAll = async () => {
    showLoader();
    try {
  const [tRes, cRes, sRes] = await Promise.all([getAllTransactions(), getExpenseCategories(), FetchAllSite()]);
  setTransactions(tRes.data || []);
  setCategories(cRes.data || []);
  // normalize sites to { id, name }
  const rawSites = (sRes && sRes.data) || [];
  const norm = rawSites.map(s => ({
    id: (s.siteId || s.SiteId || s.siteID || s.SiteID || s.id || '').toString(),
    name: (s.siteName || s.sitename || s.Sitename || s.siteName || s.name || '')
  }));
  setSites(norm);
    } catch (err) {
      console.error('load site transactions', err);
    } finally { hideLoader(); }
  };

  const applyFilters = (list) => {
    // debug
    try { console.debug('applyFilters', { filterType, filterSource, filterFrom, filterTo, total: (list || []).length }); } catch(e){}

    return (list || []).filter(t => {
      // transaction type filter (normalize)
      if (filterType && filterType !== '' ) {
        const tt = (t.transactionType || t.TransactionType || '' + '').toString().trim().toUpperCase();
        if (tt !== (filterType || '').toString().trim().toUpperCase()) return false;
      }

      // source filter: compare site ids or SiteName
      if (filterSource && filterSource !== '') {
        if (filterSource === '0001') {
          // Others: include when no siteId or explicit SourceName === 'Others'
          const hasSite = !!(t.siteId || t.SiteId || t.sourceId || t.SourceId || t.id);
          const name = (t.siteName || t.Sitename || t.SiteName || t.SourceName || t.name || '').toString();
          if (hasSite) return false;
          if (name && name.toLowerCase() !== 'others') return false;
        } else {
          const sid = t.siteId || t.SiteId || t.sourceId || t.SourceId || t.id || '';
          if ((sid || '').toString().trim() !== (filterSource || '').toString().trim()) return false;
        }
      }

      // date range filter (assume transactionDate or TransactionDate in yyyy-mm-dd)
      if (filterFrom) {
        const d = (t.transactionDate || t.TransactionDate || '').toString();
        if (!d || d < filterFrom) return false;
      }
      if (filterTo) {
        const d = (t.transactionDate || t.TransactionDate || '').toString();
        if (!d || d > filterTo) return false;
      }

      return true;
    });
  };

  const openAddCat = () => { setEditingCat(null); setCatForm({ ExpenseCategoryId: '', ExpenseCategoryName: '' }); setCatModalOpen(true); };
  const openAddTxn = () => {
    setEditingTxn(null);
    // reset form; default TransactionType to DEBIT
    setTxnForm({ SiteTransactionId: '', ExpenseCategoryId: '', SourceType: '', TransactionDate: '', Notes: '', Amount: 0, ExpenseDescription: '', TransactionType: 'DEBIT' });
    setTxnModalOpen(true);
  };

  const openEditTxn = (t) => {
    setEditingTxn(t);
  const siteIdFromT = (t.siteId || t.SiteId || t.siteID || t.SourceId || t.SourceID || t.sourceId || t.SourceType || t.id || '').toString();

  // normalize transaction type to 'DEBIT' or 'CREDIT' (trim spaces)
  let rawType = (t.transactionType || t.TransactionType || '').toString().trim();
  let txType = rawType.toUpperCase();
    if (txType.startsWith('D')) txType = 'DEBIT';
    else if (txType.startsWith('C')) txType = 'CREDIT';
    else txType = 'DEBIT';

    setTxnForm({
      SiteTransactionId: t.siteTransactionId || t.SiteTransactionId || t.SiteTransactionId,
      ExpenseCategoryId: t.expenseCategoryId || t.ExpenseCategoryId,
      // if no site id found, mark as '0001' (Others)
      SourceType: siteIdFromT || '0001',
      TransactionDate: t.transactionDate || t.TransactionDate,
      Notes: t.notes || t.Notes || '',
      Amount: t.amount || t.Amount || 0,
      ExpenseDescription: t.expenseDescription || t.ExpenseDescription || '',
      TransactionType: txType
    });
    setTxnModalOpen(true);
  };

  const saveCategory = async (e) => {
    e.preventDefault();
    showLoader();
    try {
      if (editingCat && editingCat.expenseCategoryId) {
        await updateExpenseCategory({ ExpenseCategoryId: editingCat.expenseCategoryId || editingCat.ExpenseCategoryId, ExpenseCategoryName: catForm.ExpenseCategoryName });
      } else {
        await addExpenseCategory({ ExpenseCategoryName: catForm.ExpenseCategoryName });
      }
      await loadAll();
      setCatModalOpen(false);
    } catch (err) { console.error('save category', err); } finally { hideLoader(); }
  };

  const saveTransaction = async (e) => {
    e.preventDefault();
  // client-side validation first (avoid showing loader if invalid)
    try {
  // client-side validation for required fields
  // trim and normalize TransactionType here to remove accidental spaces
  if (txnForm.TransactionType) txnForm.TransactionType = txnForm.TransactionType.toString().trim().toUpperCase();
  if (!txnForm.TransactionType || txnForm.TransactionType.toString().trim() === '') {
        alert('Transaction Type is required');
        return;
      }
      if (!txnForm.ExpenseDescription || txnForm.ExpenseDescription.toString().trim() === '') {
        alert('Expense Description is required');
        return;
      }
      if (!txnForm.Notes || txnForm.Notes.toString().trim() === '') {
        alert('Notes is required');
        return;
      }
  // all validation passed; show loader now
  showLoader();

      // prepare payload: build server-shaped object, coerce types
      const payload = { ...txnForm };
      // Amount should be a number
      if (payload.Amount && typeof payload.Amount === 'string') payload.Amount = Number(payload.Amount);

      // build PascalCase send object (server examples use PascalCase)
      const sendObj = {
        SiteTransactionId: payload.SiteTransactionId || undefined,
        // send JSON null for empty ExpenseCategoryId so backend nullable GUID parses correctly
        ExpenseCategoryId: (payload.ExpenseCategoryId && payload.ExpenseCategoryId.toString().trim() !== '') ? payload.ExpenseCategoryId : null,
        // server expects SourceId; when Others selected send null and include SourceName
        SourceId: (payload.SourceType && payload.SourceType !== '0001') ? payload.SourceType : null,
        SourceName: (payload.SourceType === '0001') ? 'Others' : undefined,
        TransactionDate: payload.TransactionDate,
        Notes: payload.Notes,
        Amount: payload.Amount,
        ExpenseDescription: payload.ExpenseDescription,
        TransactionType: payload.TransactionType,
      };

      if (!sendObj.SiteTransactionId) delete sendObj.SiteTransactionId;

      console.debug('SiteTransaction send object:', sendObj);

      // call API with direct transaction object
      if (editingTxn && (editingTxn.siteTransactionId || editingTxn.SiteTransactionId)) {
        await updateTransaction(sendObj);
      } else {
        await addTransaction(sendObj);
      }
      await loadAll();
      setTxnModalOpen(false);
    } catch (err) { 
      console.error('save txn', err);
      if (err.response && err.response.data) console.error('server response', err.response.data);
    } finally { hideLoader(); }
  };
    // compute visible list and totals once per render to use in JSX
    const visibleTransactions = applyFilters(transactions) || [];
    const totalIncome = visibleTransactions.reduce((acc, it) => {
      const amt = Number(it.amount || it.Amount || 0) || 0;
      const type = (it.transactionType || it.TransactionType || '').toString().toUpperCase();
      return type.startsWith('C') ? acc + amt : acc;
    }, 0);
    const totalExpense = visibleTransactions.reduce((acc, it) => {
      const amt = Number(it.amount || it.Amount || 0) || 0;
      const type = (it.transactionType || it.TransactionType || '').toString().toUpperCase();
      return type.startsWith('D') ? acc + amt : acc;
    }, 0);

    return (
    <>
      <Navbar />
      <div className="page-container">
        <div className="page-header">
          <h2>Site Transactions</h2>
          <div>
            <button className="btn" onClick={openAddCat} style={{ marginRight: 8 }}>Add Expense Type</button>
            <button className="btn" onClick={openAddTxn}>Add Transaction</button>
          </div>
        </div>

        <div className="list">
          <div className="filters" style={{ marginBottom: 12, display: 'flex', alignItems: 'center', gap: 12 }}>
            <label style={{ marginRight: 8 }}>Type</label>
            <select value={filterType} onChange={e => setFilterType(e.target.value)} style={{ marginRight: 12 }}>
              <option value="">All</option>
              <option value="DEBIT">DEBIT</option>
              <option value="CREDIT">CREDIT</option>
            </select>

            <label style={{ marginRight: 8 }}>Source</label>
            <select value={filterSource} onChange={e => setFilterSource(e.target.value)} style={{ marginRight: 12 }}>
              <option value="">All</option>
              {sites.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
              <option value="0001">Others</option>
            </select>

            <label style={{ marginRight: 8 }}>From</label>
            <input type="date" value={filterFrom} onChange={e => setFilterFrom(e.target.value)} style={{ marginRight: 12 }} />

            <label style={{ marginRight: 8 }}>To</label>
            <input type="date" value={filterTo} onChange={e => setFilterTo(e.target.value)} style={{ marginRight: 12 }} />

            <div style={{ marginLeft: 'auto', display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{ fontWeight: '600' }}>Visible: {visibleTransactions.length}</div>
              <div style={{ color: 'green' }}>Income: {totalIncome}</div>
              <div style={{ color: 'red' }}>Expense: {totalExpense}</div>
              <button className="btn" onClick={() => { setFilterType(''); setFilterSource(''); setFilterFrom(''); setFilterTo(''); }}>Reset</button>
            </div>
          </div>
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Type</th>
                <th>Category</th>
                <th>Source</th>
                <th>Amount</th>
                <th>Notes</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {applyFilters(transactions).map(t => (
                <tr key={t.siteTransactionId || t.SiteTransactionId}>
                  <td>{t.transactionDate || t.TransactionDate}</td>
                  <td>{t.transactionType || t.TransactionType}</td>
                  <td>{(() => {
                      const catId = (t.expenseCategoryId || t.ExpenseCategoryId || '').toString();
                      const zeroGuid = '00000000-0000-0000-0000-000000000000';
                      if (!catId || catId === zeroGuid) return 'NA';
                      const found = categories.find(c => (c.expenseCategoryId || c.ExpenseCategoryId) == catId);
                      return (found && (found.expenseCategoryName || found.ExpenseCategoryName)) || (t.expenseCategoryName || t.ExpenseCategoryName || '');
                    })()}</td>
                  <td>{(() => {
                      const sid = (t.siteId || t.SiteId || t.sourceId || t.SourceId || t.id || '').toString();
                      if (sid) {
                        const site = sites.find(s => (s.id || '').toString() === sid.toString());
                        if (site) return site.name || sid;
                        return sid;
                      }
                      // fallback to any SourceName returned or 'Others'
                      return t.SourceName || t.sourceName || 'Others';
                    })()}</td>
                  <td>{t.amount || t.Amount}</td>
                  <td>{t.notes || t.Notes}</td>
                  <td><button className="btn small" onClick={() => openEditTxn(t)}>Edit</button></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {catModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editingCat ? 'Edit Expense Type' : 'Add Expense Type'}</h3>
              <form onSubmit={saveCategory}>
                <label>Expense Category Name</label>
                <input value={catForm.ExpenseCategoryName} onChange={e => setCatForm({ ...catForm, ExpenseCategoryName: e.target.value })} required />
                <div className="modal-actions">
                  <button type="submit" className="btn">Save</button>
                  <button type="button" className="btn" onClick={() => setCatModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {txnModalOpen && (
          <div className="modal-overlay">
            <div className="modal">
              <h3>{editingTxn ? 'Edit Transaction' : 'Add Transaction'}</h3>
              <form onSubmit={saveTransaction}>
                <label>Category</label>
                <select value={txnForm.ExpenseCategoryId} onChange={e => setTxnForm({ ...txnForm, ExpenseCategoryId: e.target.value })}>
                  <option value="">-- select --</option>
                  {categories.map(c => <option key={c.expenseCategoryId || c.ExpenseCategoryId} value={c.expenseCategoryId || c.ExpenseCategoryId}>{c.expenseCategoryName || c.ExpenseCategoryName}</option>)}
                </select>

                <label>Date</label>
                <input type="date" value={txnForm.TransactionDate} onChange={e => setTxnForm({ ...txnForm, TransactionDate: e.target.value })} required />

                <label>Source Type</label>
                <select value={txnForm.SourceType} onChange={e => setTxnForm({ ...txnForm, SourceType: e.target.value })} required>
                  <option value="">-- select --</option>
                  {sites.map(s => <option key={s.siteId || s.SiteId || s.id} value={s.siteId || s.SiteId || s.SiteID || s.id}>{s.siteName || s.Sitename || s.name}</option>)}
                  <option value="0001">Others</option>
                </select>

                <label>Amount</label>
                <input type="number" value={txnForm.Amount} onChange={e => setTxnForm({ ...txnForm, Amount: e.target.value })} required />

                <label>Transaction Type</label>
                <select value={txnForm.TransactionType} onChange={e => setTxnForm({ ...txnForm, TransactionType: e.target.value })} required>
                  <option value="">-- select --</option>
                  <option value="DEBIT">DEBIT</option>
                  <option value="CREDIT">CREDIT</option>
                </select>

                <label>Expense Description</label>
                <input value={txnForm.ExpenseDescription} onChange={e => setTxnForm({ ...txnForm, ExpenseDescription: e.target.value })} required />

                <label>Notes</label>
                <textarea value={txnForm.Notes} onChange={e => setTxnForm({ ...txnForm, Notes: e.target.value })} required />

                <div className="modal-actions">
                  <button type="submit" className="btn">Save</button>
                  <button type="button" className="btn" onClick={() => setTxnModalOpen(false)}>Cancel</button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </>
  );
}

export default SiteTransaction;
