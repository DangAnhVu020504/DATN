import { useEffect, useState } from 'react';
import { useSelector } from 'react-redux';
import type { RootState } from '@/redux/store';
import { customerService } from '@/services/customerService';
import type { AddressResponse, AddressRequest } from '@/types';

const EMPTY: AddressRequest = {
  label: '', contactName: '', contactPhone: '', addressLine: '', isDefault: false,
};

export default function AddressPage() {
  const customerId = useSelector((s: RootState) => s.auth.user?.customerId);
  const [addresses, setAddresses] = useState<AddressResponse[]>([]);
  const [modal, setModal] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [form, setForm] = useState<AddressRequest>(EMPTY);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = () => {
    if (!customerId) return;
    customerService.getAddresses(customerId)
      .then((res) => setAddresses(res.data.data))
      .catch(() => setError('Khong the tai so dia chi'))
      .finally(() => setLoading(false));
  };

  useEffect(load, [customerId]);

  const set = (k: keyof AddressRequest) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const openAdd = () => { setForm(EMPTY); setEditId(null); setModal(true); };
  const openEdit = (a: AddressResponse) => {
    setForm({
      label: a.label || '', contactName: a.contactName, contactPhone: a.contactPhone,
      addressLine: a.addressLine, isDefault: a.isDefault,
    });
    setEditId(a.id);
    setModal(true);
  };

  const save = async () => {
    if (!customerId) return;
    setSaving(true);
    try {
      if (editId !== null) {
        await customerService.updateAddress(customerId, editId, form);
      } else {
        await customerService.addAddress(customerId, form);
      }
      setModal(false);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Luu dia chi that bai');
    } finally {
      setSaving(false);
    }
  };

  const remove = async (id: number) => {
    if (!customerId) return;
    try {
      await customerService.deleteAddress(customerId, id);
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Xoa dia chi that bai');
    }
  };

  const makeDefault = async (a: AddressResponse) => {
    if (!customerId) return;
    try {
      await customerService.updateAddress(customerId, a.id, {
        label: a.label || '', contactName: a.contactName, contactPhone: a.contactPhone,
        addressLine: a.addressLine, isDefault: true,
      });
      load();
    } catch (e: any) {
      setError(e.response?.data?.message || 'Cap nhat that bai');
    }
  };

  const inputCls = 'w-full px-4 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50 transition-all duration-200';

  return (
    <div className="p-6 max-w-3xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>So dia chi</h1>
          <p className="text-gray-500 text-sm mt-0.5">{addresses.length} dia chi da luu</p>
        </div>
        <button onClick={openAdd}
          className="bg-red-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all duration-200">
          âž• Them dia chi
        </button>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 text-sm rounded-xl px-4 py-3 mb-4">{error}</div>
      )}

      {loading ? (
        <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
          <div className="w-10 h-10 border-4 border-red-200 border-t-red-600 rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-400 font-medium">Dang tai...</p>
        </div>
      ) : (
      <div className="space-y-3">
        {addresses.map((a) => (
          <div key={a.id} className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 card-hover transition-all duration-200">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-blue-50 rounded-xl flex items-center justify-center text-lg">ðŸ“</div>
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-black text-gray-900 text-sm">{a.label || 'Dia chi'}</span>
                    {a.isDefault && <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Mac dinh</span>}
                  </div>
                  <div className="text-xs text-gray-400 mt-0.5">{a.contactName} Â· {a.contactPhone}</div>
                </div>
              </div>
            </div>
            <p className="text-sm text-gray-600 mb-4 bg-gray-50 rounded-xl px-3 py-2.5">{a.addressLine}</p>
            <div className="flex gap-2">
              {!a.isDefault && (
                <button onClick={() => makeDefault(a)}
                  className="px-3 py-1.5 text-xs font-semibold bg-gray-100 text-gray-600 rounded-lg hover:bg-gray-200 transition-colors">
                  â­ Dat lam mac dinh
                </button>
              )}
              <button onClick={() => openEdit(a)}
                className="px-3 py-1.5 text-xs font-semibold bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors">
                âœï¸ Sua
              </button>
              <button onClick={() => remove(a.id)}
                className="px-3 py-1.5 text-xs font-semibold bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors">
                ðŸ—‘ï¸ Xoa
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="bg-white rounded-2xl p-12 text-center border border-gray-100">
            <div className="text-5xl mb-3">ðŸ“</div>
            <p className="text-gray-400 font-medium">Chua co dia chi nao</p>
          </div>
        )}
      </div>
      )}

      {/* Modal */}
      {modal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-6 max-h-[90vh] overflow-y-auto">
            <h3 className="font-black text-gray-900 text-xl mb-5" style={{ fontFamily: 'Nunito' }}>
              {editId !== null ? 'Sua dia chi' : 'Them dia chi moi'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Nhan</label>
                <input placeholder="VD: Nha, Cong ty..." value={form.label || ''} onChange={set('label')} className={inputCls} />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Dia chi</label>
                <input placeholder="So nha, duong, phuong/xa..." value={form.addressLine} onChange={set('addressLine')} className={inputCls} />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Ten lien he</label>
                  <input placeholder="Nguyen Van A" value={form.contactName} onChange={set('contactName')} className={inputCls} />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">SDT</label>
                  <input placeholder="0901 234 567" value={form.contactPhone} onChange={set('contactPhone')} className={inputCls} />
                </div>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={!!form.isDefault} onChange={(e) => setForm((f) => ({ ...f, isDefault: e.target.checked }))} className="w-4 h-4 rounded" />
                <span className="text-sm text-gray-600">Dat lam dia chi mac dinh</span>
              </label>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModal(false)} className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50">Huy</button>
              <button onClick={save} disabled={saving}
                className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 disabled:opacity-60">
                {saving ? 'Dang luu...' : 'ðŸ’¾ Luu'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
