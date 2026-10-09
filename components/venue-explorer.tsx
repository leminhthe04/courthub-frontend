'use client';

import Link from 'next/link';
import { useQuery } from '@tanstack/react-query';
import { useState } from 'react';
import { apiFetch } from '../lib/api';
import type { VenueSummary } from '../lib/types';

export function VenueExplorer() {
  const [search, setSearch] = useState('');
  const [city, setCity] = useState('');
  const [sportType, setSportType] = useState('');
  const [submitted, setSubmitted] = useState({ search: '', city: '', sportType: '' });
  const venues = useQuery({
    queryKey: ['venues', submitted],
    queryFn: () => {
      const params = new URLSearchParams();
      if (submitted.search) params.set('search', submitted.search);
      if (submitted.city) params.set('city', submitted.city);
      if (submitted.sportType) params.set('sportType', submitted.sportType);
      return apiFetch<VenueSummary[]>(`/venues?${params.toString()}`);
    },
  });

  return (
    <section className="mx-auto max-w-7xl px-5 pb-12">
      <div className="relative overflow-hidden rounded-[2rem] bg-slate-950 px-6 py-14 text-white shadow-xl shadow-slate-200 sm:px-12">
        <div className="absolute -right-20 -top-24 h-72 w-72 rounded-full bg-emerald-400/30 blur-3xl" />
        <div className="relative max-w-2xl">
          <p className="mb-4 text-sm font-bold uppercase tracking-[0.22em] text-emerald-300">
            CourtHub
          </p>
          <h1 className="text-4xl font-black tracking-tight sm:text-6xl">
            Tìm sân. Chọn giờ. Ra sân.
          </h1>
          <p className="mt-5 max-w-xl text-lg leading-8 text-slate-300">
            Xem lịch trống theo từng sân, kéo chọn khoảng thời gian 30 phút và đặt ngay cả khi chưa
            có tài khoản.
          </p>
        </div>
      </div>

      <form
        className="relative z-10 -mt-7 grid gap-3 rounded-2xl border border-slate-200 bg-white p-4 shadow-lg sm:grid-cols-[1.5fr_1fr_1fr_auto]"
        onSubmit={(event) => {
          event.preventDefault();
          setSubmitted({ search, city, sportType });
        }}
      >
        <input
          value={search}
          onChange={(event) => setSearch(event.target.value)}
          placeholder="Tên sân hoặc địa chỉ"
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
        <input
          value={city}
          onChange={(event) => setCity(event.target.value)}
          placeholder="Thành phố"
          className="rounded-xl border border-slate-200 px-4 py-3 outline-none focus:border-emerald-500"
        />
        <select
          value={sportType}
          onChange={(event) => setSportType(event.target.value)}
          className="rounded-xl border border-slate-200 bg-white px-4 py-3 outline-none focus:border-emerald-500"
        >
          <option value="">Môn thể thao</option>
          <option value="Badminton">Cầu lông</option>
          <option value="Football">Bóng đá</option>
          <option value="Tennis">Tennis</option>
          <option value="Basketball">Bóng rổ</option>
        </select>
        <button className="rounded-xl bg-emerald-500 px-6 py-3 font-bold text-white hover:bg-emerald-600">
          Tìm sân
        </button>
      </form>

      <div className="mt-12 flex items-end justify-between gap-4">
        <div>
          <p className="text-sm font-bold uppercase tracking-[0.18em] text-emerald-600">Khám phá</p>
          <h2 className="mt-2 text-3xl font-black tracking-tight">Sân đang được yêu thích</h2>
        </div>
        <p className="hidden text-sm text-slate-500 sm:block">
          {venues.data?.length ?? 0} địa điểm
        </p>
      </div>

      {venues.isLoading && (
        <div className="mt-8 rounded-2xl border border-slate-200 bg-white p-8 text-slate-500">
          Đang tải danh sách sân…
        </div>
      )}
      {venues.isError && (
        <div className="mt-8 rounded-2xl border border-amber-200 bg-amber-50 p-6 text-amber-900">
          Chưa kết nối được API. Hãy chạy backend và kiểm tra `NEXT_PUBLIC_API_URL`.
        </div>
      )}
      {!venues.isLoading && !venues.isError && venues.data?.length === 0 && (
        <div className="mt-8 rounded-2xl border border-dashed border-slate-300 bg-white p-10 text-center text-slate-500">
          Chưa có venue phù hợp. Hãy thử từ khóa khác.
        </div>
      )}

      <div className="mt-8 grid gap-5 md:grid-cols-2 lg:grid-cols-3">
        {venues.data?.map((venue) => (
          <Link
            key={venue.id}
            href={`/venues/${venue.id}`}
            className="group overflow-hidden rounded-2xl border border-slate-200 bg-white transition hover:-translate-y-1 hover:border-emerald-300 hover:shadow-xl"
          >
            <div
              className="relative h-40 overflow-hidden bg-gradient-to-br from-emerald-400 via-teal-500 to-slate-900"
              style={
                venue.imageUrl
                  ? {
                      backgroundImage: `url(${venue.imageUrl})`,
                      backgroundSize: 'cover',
                      backgroundPosition: 'center',
                    }
                  : undefined
              }
            >
              {venue.imageUrl && (
                <div className="absolute inset-0 bg-slate-950/25 transition group-hover:bg-slate-950/10" />
              )}
              <span className="absolute left-4 top-4 rounded-full bg-white/90 px-3 py-1 text-xs font-bold text-slate-800">
                {venue.sportType}
              </span>
            </div>
            <div className="p-5">
              <h3 className="text-xl font-bold group-hover:text-emerald-600">{venue.name}</h3>
              <p className="mt-2 text-sm text-slate-500">
                {venue.address}, {venue.city}
              </p>
              <p className="mt-4 line-clamp-2 text-sm leading-6 text-slate-600">
                {venue.description ?? 'Xem lịch trống và chọn khoảng giờ phù hợp.'}
              </p>
              <span className="mt-5 inline-flex text-sm font-bold text-emerald-600">
                Xem lịch sân →
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}
