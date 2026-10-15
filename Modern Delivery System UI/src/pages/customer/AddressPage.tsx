import { useState } from 'react';

type Address = { id: number; label: string; detail: string; phone: string; isDefault: boolean };

const INITIAL: Address[] = [
  { id: 1, label: 'Nhà riêng', detail: '123 Nguyễn Trãi, P.Nguyễn Cư Trinh, Q1, TP.HCM', phone: '0901 234 567', isDefault: true },
  { id: 2, label: 'Công ty', detail: '456 Điện Biên Phủ, P.Đa Kao, Q1, TP.HCM', phone: '0901 234 567', isDefault: false },
];

export default function AddressPage() {
  const [addresses, setAddresses] = useState<Address[]>(INITIAL);
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [form, setForm] = useState({ label: '', detail: '', phone: '' });

  const openAdd = () => { setForm({ label: '', detail: '', phone: '' }); setEditingId(null); setModalOpen(true); };
  const openEdit = (a: Address) => { setForm({ label: a.label, detail: a.detail, phone: a.phone }); setEditingId(a.id); setModalOpen(true); };

  const save = () => {
    if (editingId) {
      setAddresses(as => as.map(a => a.id === editingId ? { ...a, ...form } : a));
    } else {
      setAddresses(as => [...as, { id: Date.now(), ...form, isDefault: as.length === 0 }]);
    }
    setModalOpen(false);
  };

  const remove = (id: number) => setAddresses(as => as.filter(a => a.id !== id));
  const setDefault = (id: number) => setAddresses(as => as.map(a => ({ ...a, isDefault: a.id === id })));

  return (
    <div className="p-6 max-w-2xl mx-auto" style={{ fontFamily: 'Inter, sans-serif' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-black text-gray-900" style={{ fontFamily: 'Nunito' }}>Quản lý địa chỉ</h1>
          <p className="text-gray-500 text-sm mt-0.5">{addresses.length} địa chỉ đã lưu</p>
        </div>
        <button onClick={openAdd}
          className="bg-red-gradient text-white px-4 py-2.5 rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all flex items-center gap-2">
          ➕ Thêm địa chỉ
        </button>
      </div>

      <div className="space-y-3">
        {addresses.map(a => (
          <div key={a.id} className="bg-white rounded-2xl shadow-sm border border-gray-100 p-5 transition-all hover:shadow-md">
            <div className="flex items-start justify-between gap-3">
              <div className="flex items-start gap-3">
                <div className="w-10 h-10 bg-red-50 rounded-xl flex items-center justify-center text-xl shrink-0">📍</div>
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-bold text-gray-900 text-sm">{a.label}</span>
                    {a.isDefault && (
                      <span className="text-xs bg-red-100 text-red-600 px-2 py-0.5 rounded-full font-semibold">Mặc định</span>
                    )}
                  </div>
                  <p className="text-sm text-gray-600 leading-relaxed">{a.detail}</p>
                  <p className="text-xs text-gray-400 mt-1">{a.phone}</p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              {!a.isDefault && (
                <button onClick={() => setDefault(a.id)}
                  className="px-3 py-1.5 text-xs font-semibold text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors">
                  Đặt mặc định
                </button>
              )}
              <button onClick={() => openEdit(a)}
                className="px-3 py-1.5 text-xs font-semibold text-blue-600 bg-blue-50 rounded-lg hover:bg-blue-100 transition-colors">
                ✏️ Sửa
              </button>
              <button onClick={() => remove(a.id)}
                className="px-3 py-1.5 text-xs font-semibold text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors">
                🗑️ Xóa
              </button>
            </div>
          </div>
        ))}

        {addresses.length === 0 && (
          <div className="py-16 text-center text-gray-400">
            <div className="text-5xl mb-3">📭</div>
            <p className="font-medium">Chưa có địa chỉ nào. Hãy thêm địa chỉ mới!</p>
          </div>
        )}
      </div>

      {/* Modal */}
      {modalOpen && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-end sm:items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md p-6">
            <h3 className="font-black text-gray-900 text-lg mb-5" style={{ fontFamily: 'Nunito' }}>
              {editingId ? 'Sửa địa chỉ' : 'Thêm địa chỉ mới'}
            </h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Tên địa chỉ</label>
                <input value={form.label} onChange={e => setForm(f => ({ ...f, label: e.target.value }))}
                  placeholder="Nhà riêng, Công ty, ..."
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Địa chỉ chi tiết</label>
                <input value={form.detail} onChange={e => setForm(f => ({ ...f, detail: e.target.value }))}
                  placeholder="Số nhà, đường, phường, quận, tỉnh/thành"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1.5">Số điện thoại</label>
                <input value={form.phone} onChange={e => setForm(f => ({ ...f, phone: e.target.value }))}
                  placeholder="0901 234 567"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-xl text-sm bg-gray-50" />
              </div>
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setModalOpen(false)}
                className="flex-1 py-2.5 border border-gray-200 text-gray-600 rounded-xl text-sm font-semibold hover:bg-gray-50 transition-colors">Hủy</button>
              <button onClick={save}
                className="flex-1 py-2.5 bg-red-gradient text-white rounded-xl text-sm font-semibold shadow-lg shadow-red-200 hover:opacity-90 transition-all">
                💾 Lưu
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
