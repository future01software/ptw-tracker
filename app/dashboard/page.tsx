'use client';

import React, { useState, useEffect } from 'react';

interface Stat {
  title: string;
  value: number;
  color: string;
  icon: string;
}

interface Permit {
  number: string;
  type: string;
  status: string;
  location: string;
  contractor: string;
}

export default function DashboardPage() {
  const [stats] = useState<Stat[]>([
    { title: 'Total Permits', value: 24, color: '#3b82f6', icon: '📋' },
    { title: 'Active', value: 8, color: '#10b981', icon: '✅' },
    { title: 'Expired', value: 2, color: '#ef4444', icon: '⏰' },
    { title: 'Completed', value: 12, color: '#6366f1', icon: '🎉' },
  ]);

  const [permits] = useState<Permit[]>([
    { 
      number: 'PTW-2024-001', 
      type: 'Hot Work', 
      status: 'Active', 
      location: 'Building A - Floor 5',
      contractor: 'Contractor 1'
    },
    { 
      number: 'PTW-2024-002', 
      type: 'Electrical Work', 
      status: 'Pending', 
      location: 'Building B - Floor 3',
      contractor: 'Contractor 2'
    },
    { 
      number: 'PTW-2024-003', 
      type: 'Cold Work', 
      status: 'Completed', 
      location: 'Building C - Floor 1',
      contractor: 'Contractor 3'
    },
  ]);

  return (
    <div style={{ minHeight: '100vh', background: '#f5f5f5' }}>
      {/* Header */}
      <div className="header">
        <div className="header-content">
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: 'bold', marginBottom: '4px' }}>
              PTW Tracker Dashboard
            </h1>
            <p style={{ fontSize: '14px', color: '#6b7280' }}>
              Welcome back! Here's what's happening today.
            </p>
          </div>
          <button className="btn btn-primary">
            + New Permit
          </button>
        </div>
      </div>

      {/* Content */}
      <div className="container">
        {/* Stats Grid */}
        <div className="grid grid-4" style={{ marginBottom: '30px' }}>
          {stats.map((stat, index) => (
            <div 
              key={index} 
              className="stat-card"
              style={{ borderLeftColor: stat.color }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <p style={{ fontSize: '14px', color: '#6b7280', marginBottom: '8px' }}>
                    {stat.title}
                  </p>
                  <p style={{ fontSize: '32px', fontWeight: 'bold', color: stat.color }}>
                    {stat.value}
                  </p>
                </div>
                <div style={{
                  fontSize: '32px',
                  background: `${stat.color}20`,
                  width: '60px',
                  height: '60px',
                  borderRadius: '50%',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Recent Permits */}
        <div className="card">
          <h3 style={{ fontSize: '18px', fontWeight: '600', marginBottom: '20px' }}>
            Recent Permits
          </h3>
          <div>
            {permits.map((permit, index) => (
              <div key={index} className="permit-item">
                <div>
                  <div style={{ fontWeight: '600', marginBottom: '4px' }}>
                    {permit.number}
                  </div>
                  <div style={{ fontSize: '14px', color: '#6b7280' }}>
                    {permit.type} • {permit.location} • {permit.contractor}
                  </div>
                </div>
                <span className={`badge badge-${permit.status.toLowerCase()}`}>
                  {permit.status}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))' }}>
          <div className="card">
            <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              Permits by Type
            </h4>
            <div>
              {[
                { name: 'Hot Work', count: 8, color: '#ef4444' },
                { name: 'Cold Work', count: 6, color: '#3b82f6' },
                { name: 'Electrical', count: 5, color: '#f59e0b' },
                { name: 'Confined Space', count: 3, color: '#8b5cf6' },
                { name: 'Height Work', count: 2, color: '#ec4899' },
              ].map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: index < 4 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: item.color 
                    }} />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <h4 style={{ marginBottom: '16px', fontSize: '16px', fontWeight: '600' }}>
              Risk Levels
            </h4>
            <div>
              {[
                { name: 'High Risk', count: 8, color: '#ef4444' },
                { name: 'Medium Risk', count: 10, color: '#f59e0b' },
                { name: 'Low Risk', count: 6, color: '#10b981' },
              ].map((item, index) => (
                <div key={index} style={{ 
                  display: 'flex', 
                  justifyContent: 'space-between',
                  padding: '12px 0',
                  borderBottom: index < 2 ? '1px solid #f3f4f6' : 'none'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <div style={{ 
                      width: '12px', 
                      height: '12px', 
                      borderRadius: '50%', 
                      background: item.color 
                    }} />
                    <span>{item.name}</span>
                  </div>
                  <span style={{ fontWeight: '600' }}>{item.count}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
