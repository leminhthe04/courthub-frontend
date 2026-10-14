'use client';

import { useTranslations } from 'next-intl';
import { useState } from 'react';
import { useVenueSchedule } from '../hooks';
import { ScheduleGrid } from './schedule-grid';

function todayVietnam() {
  return new Intl.DateTimeFormat('en-CA', { timeZone: 'Asia/Ho_Chi_Minh' }).format(new Date());
}

interface PartnerVenueOverviewTabProps {
  venueId: string;
}

export function PartnerVenueOverviewTab({ venueId }: PartnerVenueOverviewTabProps) {
  const t = useTranslations('partnerDashboard');
  const tCommon = useTranslations('common');
  const tErrors = useTranslations('errors');

  const [overviewDate, setOverviewDate] = useState(todayVietnam);
  const schedule = useVenueSchedule(venueId, overviewDate, true);

  return (
    <section className="mt-8 min-h-[32rem] space-y-6">
      <div className="rounded border border-slate-200 bg-white p-6 shadow-sm">
        <div className="border-b border-slate-100 pb-4">
          <h2 className="text-xl font-black text-slate-900">{t('overviewTitle')}</h2>
        </div>

        <div className="mt-6">
          {schedule.isLoading && (
            <div className="p-8 text-center text-sm font-medium text-slate-500">
              {tCommon('loading')}
            </div>
          )}
          {schedule.isError && (
            <div className="rounded-lg border border-rose-200 bg-rose-50 p-6 text-sm font-semibold text-rose-700">
              {tErrors('default')}
            </div>
          )}
          {schedule.data &&
            (schedule.data.courts.length === 0 ? (
              <div className="rounded-lg border border-dashed border-slate-300 p-12 text-center">
                <p className="font-semibold text-slate-700">{t('noCourtsInVenue')}</p>
              </div>
            ) : (
              <ScheduleGrid
                schedule={schedule.data}
                readOnly={true}
                onDateChange={setOverviewDate}
              />
            ))}
        </div>
      </div>
    </section>
  );
}
