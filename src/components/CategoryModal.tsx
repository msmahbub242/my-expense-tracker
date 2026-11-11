import React, { useState } from 'react';
import { X, Plus, Layers, Check, Trash2 } from 'lucide-react';
import { Category, CategoryType } from '../types/expense.ts';
import { CategoryIcon } from './CategoryIcon.tsx';

interface CategoryModalProps {
  isOpen: boolean;
  onClose: () => void;
  categories: Category[];
  onAddCategory: (category: Omit<Category, 'id'>) => void;
  onDeleteCategory: (categoryId: string) => void;
}

const AVAILABLE_ICONS = [
  'Utensils',
  'Home',
  'Zap',
  'HeartPulse',
  'ShoppingBag',
  'Car',
  'Briefcase',
  'Laptop',
  'TrendingUp',
  'Coffee',
  'Film',
  'Book',
  'GraduationCap',
  'Plane',
  'Gift',
  'Wallet',
  'Smartphone',
];

const AVAILABLE_COLORS = [
  '#f59e0b', // amber
  '#ef4444', // red
  '#3b82f6', // blue
  '#10b981', // emerald
  '#ec4899', // pink
  '#8b5cf6', // purple
  '#06b6d4', // cyan
  '#14b8a6', // teal
  '#f97316', // orange
  '#6366f1', // indigo
];

export const CategoryModal: React.FC<CategoryModalProps> = ({
  isOpen,
  onClose,
  categories,
  onAddCategory,
  onDeleteCategory,
}) => {
  const [name, setName] = useState('');
  const [icon, setIcon] = useState('Coffee');
  const [color, setColor] = useState('#f59e0b');
  const [type, setType] = useState<CategoryType>('expense');
  const [showAddForm, setShowAddForm] = useState(false);
  const [error, setError] = useState('');

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!name.trim()) {
      setError('Please provide a category name.');
      return;
    }
    if (categories.some((c) => c.name.toLowerCase() === name.trim().toLowerCase())) {
      setError('A category with this name already exists.');
      return;
    }

    onAddCategory({
      name: name.trim(),
      icon,
      color,
      type,
      isCustom: true,
    });

    setName('');
    setShowAddForm(false);
    setError('');
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-950/80 backdrop-blur-sm overflow-y-auto">
      <div className="bg-slate-900 border border-slate-800 rounded-3xl w-full max-w-xl shadow-2xl overflow-hidden my-8">
        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-800 flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="p-2 rounded-xl bg-cyan-500/20 text-cyan-400">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-lg font-bold text-white">Categories Management</h3>
              <p className="text-xs text-slate-400">
                Pre-defined & custom categories for expenses and earnings
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            aria-label="Close categories modal"
            className="p-2 text-slate-400 hover:text-white rounded-xl hover:bg-slate-800 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-5">
          {/* Add Category Toggle Button */}
          {!showAddForm ? (
            <button
              onClick={() => setShowAddForm(true)}
              className="w-full py-2.5 px-4 rounded-xl border border-dashed border-cyan-500/40 hover:border-cyan-500 bg-cyan-500/5 hover:bg-cyan-500/10 text-cyan-300 text-xs sm:text-sm font-semibold flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              Create Custom Category
            </button>
          ) : (
            <form
              onSubmit={handleCreate}
              className="p-4 rounded-2xl bg-slate-800/80 border border-cyan-500/40 space-y-3.5"
            >
              <div className="flex items-center justify-between">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <Plus className="w-4 h-4 text-cyan-400" />
                  New Category Details
                </h4>
                <button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="text-xs text-slate-400 hover:text-white"
                >
                  Cancel
                </button>
              </div>

              {error && (
                <div className="p-2 rounded-lg bg-rose-500/20 border border-rose-500/30 text-rose-300 text-xs">
                  {error}
                </div>
              )}

              {/* Name & Type */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">
                    Category Name *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Subscriptions, Pet Care"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-300 mb-1">Type *</label>
                  <select
                    value={type}
                    onChange={(e) => setType(e.target.value as CategoryType)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-white text-xs sm:text-sm focus:outline-none focus:border-cyan-400"
                  >
                    <option value="expense">Expense Category</option>
                    <option value="income">Income Category</option>
                  </select>
                </div>
              </div>

              {/* Icon Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Icon
                </label>
                <div className="flex flex-wrap gap-2 max-h-24 overflow-y-auto p-1 bg-slate-900/60 rounded-xl border border-slate-800">
                  {AVAILABLE_ICONS.map((ic) => (
                    <button
                      key={ic}
                      type="button"
                      onClick={() => setIcon(ic)}
                      className={`p-2 rounded-lg transition-all ${
                        icon === ic
                          ? 'bg-cyan-500 text-slate-950 font-bold scale-105'
                          : 'bg-slate-800 text-slate-300 hover:bg-slate-700'
                      }`}
                      title={ic}
                    >
                      <CategoryIcon name={ic} className="w-4 h-4" />
                    </button>
                  ))}
                </div>
              </div>

              {/* Color Picker */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Select Color Theme
                </label>
                <div className="flex items-center gap-2">
                  {AVAILABLE_COLORS.map((c) => (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setColor(c)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center transition-transform ${
                        color === c ? 'scale-110 ring-2 ring-white ring-offset-2 ring-offset-slate-900' : 'opacity-80 hover:opacity-100'
                      }`}
                      style={{ backgroundColor: c }}
                    >
                      {color === c && <Check className="w-3.5 h-3.5 text-white stroke-[3]" />}
                    </button>
                  ))}
                </div>
              </div>

              <div className="pt-1 flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 rounded-xl bg-cyan-500 hover:bg-cyan-400 text-slate-950 font-bold text-xs sm:text-sm shadow-md transition-all active:scale-95"
                >
                  Save Category
                </button>
              </div>
            </form>
          )}

          {/* List of Existing Categories */}
          <div>
            <h4 className="text-xs font-bold uppercase tracking-wider text-slate-400 mb-2.5">
              Current Categories ({categories.length})
            </h4>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 max-h-72 overflow-y-auto pr-1">
              {categories.map((cat) => (
                <div
                  key={cat.id}
                  className="p-2.5 rounded-xl bg-slate-800/50 border border-slate-700/60 flex items-center justify-between"
                >
                  <div className="flex items-center gap-2.5">
                    <div
                      className="w-8 h-8 rounded-lg flex items-center justify-center text-white"
                      style={{ backgroundColor: `${cat.color}25`, color: cat.color }}
                    >
                      <CategoryIcon name={cat.icon} className="w-4 h-4" />
                    </div>
                    <div>
                      <span className="text-xs font-semibold text-white block">{cat.name}</span>
                      <span className="text-[10px] uppercase font-bold text-slate-400">
                        {cat.type} {cat.isCustom ? '• Custom' : ''}
                      </span>
                    </div>
                  </div>

                  {cat.isCustom && (
                    <button
                      onClick={() => onDeleteCategory(cat.id)}
                      className="p-1.5 text-slate-400 hover:text-rose-400 rounded-lg hover:bg-slate-700/50 transition-colors"
                      title="Delete category"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-slate-800 flex justify-end bg-slate-900/60">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-200 text-xs sm:text-sm font-semibold"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  );
};
