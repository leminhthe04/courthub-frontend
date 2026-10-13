'use client';

import { useLocale, useTranslations } from 'next-intl';
import { Pencil, Plus, X, Trash } from 'lucide-react';
import { useEffect, useMemo, useState } from 'react';
import { useSetPricingRules } from '../hooks';
import { formatCurrency, getLocalizedErrorMessage } from '../lib/formatters';
import { showConfirm, showToast } from '../lib/toast';
import type { DayOfWeek, VenueDetail, VenuePricingRule } from '../lib/types';

const DAYS: DayOfWeek[] = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN'];

interface PartnerVenuePricingTabProps {
  venue: VenueDetail;
}

function copyRules(rules: VenuePricingRule[]) {
  return rules.map((rule) => ({
    id: rule.id,
    dayOfWeek: rule.dayOfWeek,
    startTime: rule.startTime.slice(0, 5),
    endTime: rule.endTime.slice(0, 5),
    hourlyRate: rule.hourlyRate,
  }));
}

function formatPriceInput(value: string | number) {
  const digits = String(value).replace(/\D/g, '');
  return digits ? Number(digits).toLocaleString('en-US') : '';
}

function parsePriceInput(value: string) {
  return Number(value.replace(/,/g, ''));
}

export function PartnerVenuePricingTab({ venue }: PartnerVenuePricingTabProps) {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');
  const [rules, setRules] = useState(copyRules(venue.pricingRules ?? []));
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(DAYS);
  const [newStart, setNewStart] = useState('05:00');
  const [newEnd, setNewEnd] = useState('11:00');
  const [newRate, setNewRate] = useState('150000');
  const [editingRuleId, setEditingRuleId] = useState<string | null>(null);
  const [editStart, setEditStart] = useState('');
  const [editEnd, setEditEnd] = useState('');
  const [editRate, setEditRate] = useState('');
  const [addingDay, setAddingDay] = useState<DayOfWeek | null>(null);
  const [dayStart, setDayStart] = useState('05:00');
  const [dayEnd, setDayEnd] = useState('11:00');
  const [dayRate, setDayRate] = useState('150,000');

  useEffect(() => {
    // The server response is the source of truth after a successful save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRules(copyRules(venue.pricingRules ?? []));
  }, [venue.pricingRules]);

  const save = useSetPricingRules({
    onError: (error) => showToast.error(getLocalizedErrorMessage(error, tErrors)),
  });

  const persistRules = (nextRules: typeof rules) => {
    const previousRules = rules;
    setRules(nextRules);
    save.mutate(
      {
        venueId: venue.id,
        rules: nextRules.map(({ dayOfWeek, startTime, endTime, hourlyRate }) => ({
          dayOfWeek,
          startTime,
          endTime,
          hourlyRate,
        })),
      },
      {
        onSuccess: () => showToast.success(t('pricingRulesSaved')),
        onError: () => setRules(previousRules),
      },
    );
  };

  const rulesByDay = useMemo(
    () =>
      Object.fromEntries(
        DAYS.map((day) => [day, rules.filter((rule) => rule.dayOfWeek === day)]),
      ) as Record<DayOfWeek, typeof rules>,
    [rules],
  );

  const dayLabel = (day: DayOfWeek) => t(`days.${day}`);

  const toggleDay = (day: DayOfWeek) => {
    setSelectedDays((current) =>
      current.includes(day) ? current.filter((item) => item !== day) : [...current, day],
    );
  };

  const addRule = (event: React.FormEvent) => {
    event.preventDefault();
    const rate = parsePriceInput(newRate);
    if (!selectedDays.length || newStart >= newEnd || Number.isNaN(rate) || rate < 0) return;
    persistRules([
      ...rules.filter(
        (rule) =>
          !(
            selectedDays.includes(rule.dayOfWeek) &&
            rule.startTime === newStart &&
            rule.endTime === newEnd
          ),
      ),
      ...selectedDays.map((day) => ({
        id: crypto.randomUUID(),
        dayOfWeek: day,
        startTime: newStart,
        endTime: newEnd,
        hourlyRate: rate,
      })),
    ]);
  };

  const removeRule = async (rule: (typeof rules)[number]) => {
    const result = await showConfirm({
      title: t('deletePricingRuleConfirm'),
      text: `${rule.startTime.slice(0, 5)}-${rule.endTime.slice(0, 5)}`,
      confirmButtonText: tCommon('confirm'),
      cancelButtonText: tCommon('cancel'),
    });

    if (!result.isConfirmed) return;
    persistRules(rules.filter((item) => item.id !== rule.id));
  };

  const addRuleForDay = (event: React.FormEvent, day: DayOfWeek) => {
    event.preventDefault();
    const rate = parsePriceInput(dayRate);
    if (!dayStart || !dayEnd || dayStart >= dayEnd || Number.isNaN(rate) || rate < 0) return;

    persistRules([
      ...rules.filter(
        (rule) =>
          !(rule.dayOfWeek === day && rule.startTime === dayStart && rule.endTime === dayEnd),
      ),
      {
        id: crypto.randomUUID(),
        dayOfWeek: day,
        startTime: dayStart,
        endTime: dayEnd,
        hourlyRate: rate,
      },
    ]);
    setAddingDay(null);
  };

  const startEditing = (rule: (typeof rules)[number]) => {
    setEditingRuleId(rule.id);
    setEditStart(rule.startTime);
    setEditEnd(rule.endTime);
    setEditRate(formatPriceInput(rule.hourlyRate));
  };

  const cancelEditing = () => setEditingRuleId(null);

  const saveEditing = (id: string) => {
    const rate = parsePriceInput(editRate);
    if (!editStart || !editEnd || editStart >= editEnd || Number.isNaN(rate) || rate < 0) return;
    persistRules(
      rules.map((rule) =>
        rule.id === id
          ? { ...rule, startTime: editStart, endTime: editEnd, hourlyRate: rate }
          : rule,
      ),
    );
    setEditingRuleId(null);
  };

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">{t('pricingRulesTitle')}</h2>
          </div>
          {save.isPending && (
            <span className="text-sm font-semibold text-orange-600">{t('savingPricingRules')}</span>
          )}
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <form onSubmit={addRule} className="space-y-4 rounded border border-slate-200 p-4">
            <h3 className="font-black text-slate-900">{t('addSeriesPricingRule')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-700">
                {t('startTime')}
                <input
                  required
                  type="time"
                  step="1800"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"
                />
              </label>
              <label className="text-xs font-bold text-slate-700">
                {t('endTime')}
                <input
                  required
                  type="time"
                  step="1800"
                  value={newEnd}
                  onChange={(event) => setNewEnd(event.target.value)}
                  className="mt-1 w-full rounded border border-slate-200 px-2 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-slate-700">
              {t('hourlyRate')}
              <input
                required
                type="text"
                inputMode="numeric"
                value={formatPriceInput(newRate)}
                onChange={(event) => setNewRate(formatPriceInput(event.target.value))}
                onFocus={(event) => event.currentTarget.select()}
                className="mt-1 w-full rounded border border-slate-200 px-3 py-2 text-sm"
              />
            </label>
            <div>
              <p className="text-xs font-bold text-slate-700">{t('applyToDays')}</p>
              <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                {DAYS.map((day) => (
                  <label key={day} className="flex items-center gap-2">
                    <input
                      type="checkbox"
                      checked={selectedDays.includes(day)}
                      onChange={() => toggleDay(day)}
                    />
                    {dayLabel(day)}
                  </label>
                ))}
              </div>
            </div>
            <button
              type="submit"
              className="w-full rounded bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
            >
              + {t('add')}
            </button>
          </form>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DAYS.map((day) => (
                <div key={day} className="rounded border border-slate-200 p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-black text-slate-900">{dayLabel(day)}</h3>
                    <div className="flex items-center gap-2">
                      <button
                        type="button"
                        title={t('addPricingRule')}
                        aria-label={`${t('addPricingRule')} - ${dayLabel(day)}`}
                        onClick={() => setAddingDay((current) => (current === day ? null : day))}
                        className="rounded-md p-1 text-orange-600 hover:bg-orange-50 hover:text-orange-700"
                      >
                        <Plus className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                  {addingDay === day && (
                    <form
                      onSubmit={(event) => addRuleForDay(event, day)}
                      className="mt-3 space-y-2 rounded-md bg-orange-50 p-3"
                    >
                      <div className="grid grid-cols-2 gap-2">
                        <label className="text-[11px] font-bold text-slate-700">
                          {t('startTime')}
                          <input
                            type="time"
                            step="1800"
                            value={dayStart}
                            onChange={(event) => setDayStart(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                          />
                        </label>
                        <label className="text-[11px] font-bold text-slate-700">
                          {t('endTime')}
                          <input
                            type="time"
                            step="1800"
                            value={dayEnd}
                            onChange={(event) => setDayEnd(event.target.value)}
                            className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                          />
                        </label>
                      </div>
                      <label className="block text-[11px] font-bold text-slate-700">
                        {t('hourlyRate')}
                        <input
                          type="text"
                          inputMode="numeric"
                          value={dayRate}
                          onChange={(event) => setDayRate(formatPriceInput(event.target.value))}
                          onFocus={(event) => event.currentTarget.select()}
                          className="mt-1 w-full rounded-md border border-slate-200 bg-white px-2 py-1.5 text-xs"
                        />
                      </label>
                      <button
                        type="submit"
                        className="w-full rounded-md bg-orange-500 px-2 py-1.5 text-xs font-bold text-white hover:bg-orange-600"
                      >
                        + {t('addPricingRule')}
                      </button>
                    </form>
                  )}
                  <div className="mt-3 space-y-2">
                    {rulesByDay[day].length === 0 ? (
                      <p className="text-sm text-slate-400">{t('noPricingRules')}</p>
                    ) : (
                      rulesByDay[day].map((rule) => (
                        <div key={rule.id} className="border-b border-slate-100 pb-2 text-sm">
                          {editingRuleId === rule.id ? (
                            <div className="space-y-2">
                              <div className="grid grid-cols-2 gap-2">
                                <input
                                  type="time"
                                  step="1800"
                                  value={editStart}
                                  onChange={(event) => setEditStart(event.target.value)}
                                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                                />
                                <input
                                  type="time"
                                  step="1800"
                                  value={editEnd}
                                  onChange={(event) => setEditEnd(event.target.value)}
                                  className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                                />
                              </div>
                              <input
                                type="text"
                                inputMode="numeric"
                                value={editRate}
                                onChange={(event) =>
                                  setEditRate(formatPriceInput(event.target.value))
                                }
                                onFocus={(event) => event.currentTarget.select()}
                                className="w-full rounded-md border border-slate-200 px-2 py-1.5 text-xs"
                              />
                              <div className="flex justify-end gap-2">
                                <button
                                  type="button"
                                  onClick={cancelEditing}
                                  className="inline-flex items-center gap-1 rounded-md px-2 py-1 text-xs font-bold text-slate-500 hover:bg-slate-100"
                                >
                                  <X className="h-3.5 w-3.5" />
                                  {t('cancelEdit')}
                                </button>
                                <button
                                  type="button"
                                  onClick={() => saveEditing(rule.id)}
                                  className="rounded-md bg-orange-500 px-2 py-1 text-xs font-bold text-white hover:bg-orange-600"
                                >
                                  {t('saveEdit')}
                                </button>
                              </div>
                            </div>
                          ) : (
                            <div className="flex items-center justify-between gap-2">
                              <span className="font-bold">
                                {rule.startTime.slice(0, 5)}-{rule.endTime.slice(0, 5)}
                                <span className="block font-normal text-slate-500">
                                  {formatCurrency(rule.hourlyRate, locale)}/h
                                </span>
                              </span>
                              <div className="flex items-center gap-2">
                                <button
                                  type="button"
                                  title={t('editPricingRule')}
                                  aria-label={`${t('editPricingRule')} - ${rule.startTime.slice(0, 5)}`}
                                  onClick={() => startEditing(rule)}
                                  className="rounded-md p-1 text-slate-500 hover:bg-slate-100 hover:text-slate-900"
                                >
                                  <Pencil className="h-3.5 w-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={() => removeRule(rule)}
                                  title={t('deletePricingRule')}
                                  aria-label={`${t('deletePricingRule')} - ${rule.startTime.slice(0, 5)}`}
                                  className="text-xs font-bold text-rose-600 hover:text-rose-800"
                                >
                                  <Trash className="h-3.5 w-3.5" />
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
