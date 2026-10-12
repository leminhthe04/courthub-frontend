'use client';

import { useLocale, useTranslations } from 'next-intl';
import { useEffect, useMemo, useState } from 'react';
import { useSetPricingRules } from '../hooks';
import { formatCurrency, getLocalizedErrorMessage } from '../lib/formatters';
import { showToast } from '../lib/toast';
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

export function PartnerVenuePricingTab({ venue }: PartnerVenuePricingTabProps) {
  const locale = useLocale();
  const t = useTranslations('partnerDashboard');
  const tErrors = useTranslations('errors');
  const [rules, setRules] = useState(copyRules(venue.pricingRules ?? []));
  const [selectedDays, setSelectedDays] = useState<DayOfWeek[]>(DAYS);
  const [newStart, setNewStart] = useState('05:00');
  const [newEnd, setNewEnd] = useState('11:00');
  const [newRate, setNewRate] = useState('150000');

  useEffect(() => {
    // The server response is the source of truth after a successful save.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setRules(copyRules(venue.pricingRules ?? []));
  }, [venue.pricingRules]);

  const save = useSetPricingRules({
    onSuccess: () => showToast.success(t('pricingRulesSaved')),
    onError: (error) => showToast.error(getLocalizedErrorMessage(error, tErrors)),
  });

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
    if (!selectedDays.length || newStart >= newEnd || Number(newRate) < 0) return;
    setRules((current) => [
      ...current.filter(
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
        hourlyRate: Number(newRate),
      })),
    ]);
  };

  const removeRule = (id: string) =>
    setRules((current) => current.filter((rule) => rule.id !== id));

  return (
    <section className="mt-8 space-y-6">
      <div className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
        <div className="flex flex-wrap items-start justify-between gap-4">
          <div>
            <h2 className="text-xl font-black text-slate-900">{t('pricingRulesTitle')}</h2>
          </div>
          <button
            type="button"
            onClick={() =>
              save.mutate({
                venueId: venue.id,
                rules: rules.map(({ dayOfWeek, startTime, endTime, hourlyRate }) => ({
                  dayOfWeek,
                  startTime,
                  endTime,
                  hourlyRate,
                })),
              })
            }
            disabled={save.isPending}
            className="rounded-lg bg-orange-500 px-4 py-2.5 text-sm font-bold text-white hover:bg-orange-600 disabled:opacity-60"
          >
            {save.isPending ? t('savingPricingRules') : t('savePricingRules')}
          </button>
        </div>

        <div className="mt-6 grid gap-6 lg:grid-cols-[280px_1fr]">
          <form onSubmit={addRule} className="space-y-4 rounded-lg border border-slate-200 p-4">
            <h3 className="font-black text-slate-900">{t('addPricingRule')}</h3>
            <div className="grid grid-cols-2 gap-3">
              <label className="text-xs font-bold text-slate-700">
                {t('startTime')}
                <input
                  required
                  type="time"
                  step="1800"
                  value={newStart}
                  onChange={(event) => setNewStart(event.target.value)}
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
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
                  className="mt-1 w-full rounded-md border border-slate-200 px-2 py-2 text-sm"
                />
              </label>
            </div>
            <label className="block text-xs font-bold text-slate-700">
              {t('hourlyRate')}
              <input
                required
                type="number"
                min="0"
                step="1000"
                value={newRate}
                onChange={(event) => setNewRate(event.target.value)}
                className="mt-1 w-full rounded-md border border-slate-200 px-3 py-2 text-sm"
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
              className="w-full rounded-lg bg-slate-900 px-4 py-2.5 text-sm font-bold text-white hover:bg-slate-700"
            >
              + {t('addPricingRule')}
            </button>
          </form>

          <div className="space-y-4">
            <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {DAYS.map((day) => (
                <div key={day} className="rounded-lg border border-slate-200 p-4">
                  <div className="flex items-center justify-between border-b border-slate-100 pb-2">
                    <h3 className="font-black text-slate-900">{dayLabel(day)}</h3>
                    <span className="text-xs text-slate-500">{rulesByDay[day].length}</span>
                  </div>
                  <div className="mt-3 space-y-2">
                    {rulesByDay[day].length === 0 ? (
                      <p className="text-sm text-slate-400">{t('noPricingRules')}</p>
                    ) : (
                      rulesByDay[day].map((rule) => (
                        <div
                          key={rule.id}
                          className="flex items-center justify-between gap-2 border-b border-slate-100 pb-2 text-sm"
                        >
                          <span className="font-bold">
                            {rule.startTime.slice(0, 5)}-{rule.endTime.slice(0, 5)}
                            <span className="block font-normal text-slate-500">
                              {formatCurrency(rule.hourlyRate, locale)}/h
                            </span>
                          </span>
                          <button
                            type="button"
                            onClick={() => removeRule(rule.id)}
                            className="text-xs font-bold text-rose-600 hover:text-rose-800"
                          >
                            {t('deletePricingRule')}
                          </button>
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
