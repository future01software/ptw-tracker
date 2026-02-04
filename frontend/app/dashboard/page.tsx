'use client';

export default function DashboardPage() {
  const stats = [
    { title: 'Total Permits', value: 24, color: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', icon: '📋', trend: '+12%' },
    { title: 'Active Permits', value: 8, color: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', icon: '✨', trend: '+8%' },
    { title: 'Expired', value: 2, color: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)', icon: '⚠️', trend: '-3%' },
    { title: 'Completed', value: 12, color: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)', icon: '🎉', trend: '+15%' },
  ];

  const permits = [
    { 
      number: 'PTW-2024-001', 
      type: 'Hot Work', 
      status: 'Active', 
      location: 'Building A - Floor 5',
      contractor: 'ABC Contractors',
      risk: 'High',
      time: '2 hours ago'
    },
    { 
      number: 'PTW-2024-002', 
      type: 'Electrical Work', 
      status: 'Pending', 
      location: 'Building B - Floor 3',
      contractor: 'XYZ Electric',
      risk: 'Medium',
      time: '5 hours ago'
    },
    { 
      number: 'PTW-2024-003', 
      type: 'Cold Work', 
      status: 'Completed', 
      location: 'Building C - Floor 1',
      contractor: 'DEF Services',
      risk: 'Low',
      time: '1 day ago'
    },
  ];

  const statusColors: Record<string, { bg: string; text: string; dot: string }> = {
    'Active': { bg: '#dbeafe', text: '#1e40af', dot: '#3b82f6' },
    'Pending': { bg: '#fef3c7', text: '#92400e', dot: '#f59e0b' },
    'Completed': { bg: '#d1fae5', text: '#065f46', dot: '#10b981' },
  };

  const riskColors: Record<string, string> = {
    'High': '#ef4444',
    'Medium': '#f59e0b',
    'Low': '#10b981',
  };

  return (
    <div style={{ 
      minHeight: '100vh', 
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '20px'
    }}>
      {/* Header */}
      <div style={{ 
        maxWidth: '1400px', 
        margin: '0 auto 30px',
        background: 'rgba(255, 255, 255, 0.95)',
        backdropFilter: 'blur(10px)',
        borderRadius: '20px',
        padding: '30px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.15)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <div>
            <h1 style={{ 
              fontSize: '32px', 
              fontWeight: '800', 
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              marginBottom: '8px'
            }}>
              PTW Tracker Dashboard
            </h1>
            <p style={{ fontSize: '16px', color: '#64748b', fontWeight: '500' }}>
              Welcome back! Here's your overview for today
            </p>
          </div>
          <button style={{
            padding: '14px 28px',
            background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontWeight: '600',
            fontSize: '15px',
            boxShadow: '0 10px 25px rgba(102, 126, 234, 0.4)',
            transition: 'all 0.3s ease',
            display: 'flex',
            alignItems: 'center',
            gap: '8px'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 15px 35px rgba(102, 126, 234, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 10px 25px rgba(102, 126, 234, 0.4)';
          }}
          >
            <span style={{ fontSize: '18px' }}>+</span>
            New Permit
          </button>
        </div>
      </div>

      {/* Content Container */}
      <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
        
        {/* Stats Grid */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))',
          gap: '24px',
          marginBottom: '30px'
        }}>
          {stats.map((stat, index) => (
            <div key={index} style={{
              background: 'rgba(255, 255, 255, 0.95)',
              backdropFilter: 'blur(10px)',
              borderRadius: '20px',
              padding: '28px',
              boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
              border: '1px solid rgba(255,255,255,0.5)',
              transition: 'all 0.3s ease',
              cursor: 'pointer',
              position: 'relative',
              overflow: 'hidden'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-8px)';
              e.currentTarget.style.boxShadow = '0 25px 70px rgba(0,0,0,0.18)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)';
              e.currentTarget.style.boxShadow = '0 20px 60px rgba(0,0,0,0.12)';
            }}
            >
              {/* Gradient Overlay */}
              <div style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '6px',
                background: stat.color
              }} />

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                <div style={{ flex: 1 }}>
                  <p style={{ 
                    fontSize: '14px', 
                    color: '#64748b', 
                    fontWeight: '600', 
                    marginBottom: '12px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.5px'
                  }}>
                    {stat.title}
                  </p>
                  <p style={{ 
                    fontSize: '48px', 
                    fontWeight: '800', 
                    background: stat.color,
                    WebkitBackgroundClip: 'text',
                    WebkitTextFillColor: 'transparent',
                    lineHeight: '1',
                    marginBottom: '12px'
                  }}>
                    {stat.value}
                  </p>
                  <div style={{ 
                    display: 'flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    fontSize: '13px',
                    fontWeight: '600',
                    color: '#10b981'
                  }}>
                    <span>↗</span>
                    <span>{stat.trend} from last month</span>
                  </div>
                </div>
                <div style={{
                  fontSize: '48px',
                  background: stat.color,
                  width: '80px',
                  height: '80px',
                  borderRadius: '20px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  boxShadow: '0 10px 30px rgba(0,0,0,0.1)'
                }}>
                  {stat.icon}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Charts Row */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(400px, 1fr))', 
          gap: '24px', 
          marginBottom: '30px' 
        }}>
          
          {/* Permits by Type */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '20px', 
            padding: '28px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.5)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#1a202c' }}>
              Permits by Type
            </h3>
            <div>
              {[
                { name: 'Hot Work', count: 8, color: '#ef4444', percentage: 33 },
                { name: 'Cold Work', count: 6, color: '#3b82f6', percentage: 25 },
                { name: 'Electrical', count: 5, color: '#f59e0b', percentage: 21 },
                { name: 'Confined Space', count: 3, color: '#8b5cf6', percentage: 13 },
                { name: 'Height Work', count: 2, color: '#ec4899', percentage: 8 },
              ].map((item, index) => (
                <div key={index} style={{
                  padding: '16px 0',
                  borderBottom: index < 4 ? '1px solid #f1f5f9' : 'none'
                }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{
                        width: '12px',
                        height: '12px',
                        borderRadius: '50%',
                        background: item.color,
                        boxShadow: `0 0 10px ${item.color}50`
                      }} />
                      <span style={{ fontSize: '15px', fontWeight: '600', color: '#1a202c' }}>{item.name}</span>
                    </div>
                    <span style={{ fontSize: '18px', fontWeight: '700', color: item.color }}>{item.count}</span>
                  </div>
                  <div style={{
                    height: '8px',
                    background: '#f1f5f9',
                    borderRadius: '10px',
                    overflow: 'hidden'
                  }}>
                    <div style={{
                      height: '100%',
                      background: `linear-gradient(90deg, ${item.color}, ${item.color}dd)`,
                      width: `${item.percentage}%`,
                      borderRadius: '10px',
                      transition: 'width 1s ease'
                    }} />
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Risk Levels */}
          <div style={{ 
            background: 'rgba(255, 255, 255, 0.95)', 
            backdropFilter: 'blur(10px)',
            borderRadius: '20px', 
            padding: '28px', 
            boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
            border: '1px solid rgba(255,255,255,0.5)'
          }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', marginBottom: '24px', color: '#1a202c' }}>
              Risk Distribution
            </h3>
            <div>
              {[
                { name: 'High Risk', count: 8, color: '#ef4444', icon: '🔴', gradient: 'linear-gradient(135deg, #fa709a 0%, #fee140 100%)' },
                { name: 'Medium Risk', count: 10, color: '#f59e0b', icon: '🟡', gradient: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)' },
                { name: 'Low Risk', count: 6, color: '#10b981', icon: '🟢', gradient: 'linear-gradient(135deg, #30cfd0 0%, #330867 100%)' },
              ].map((item, index) => (
                <div key={index} style={{
                  padding: '20px',
                  marginBottom: '16px',
                  background: `${item.color}10`,
                  borderRadius: '16px',
                  border: `2px solid ${item.color}30`,
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                  transition: 'all 0.3s ease',
                  cursor: 'pointer'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.transform = 'scale(1.02)';
                  e.currentTarget.style.borderColor = item.color;
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.transform = 'scale(1)';
                  e.currentTarget.style.borderColor = `${item.color}30`;
                }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
                    <span style={{ fontSize: '32px' }}>{item.icon}</span>
                    <span style={{ fontSize: '16px', fontWeight: '600', color: '#1a202c' }}>{item.name}</span>
                  </div>
                  <span style={{ 
                    fontSize: '28px', 
                    fontWeight: '800', 
                    color: item.color,
                    textShadow: `0 2px 10px ${item.color}50`
                  }}>
                    {item.count}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Recent Permits */}
        <div style={{ 
          background: 'rgba(255, 255, 255, 0.95)', 
          backdropFilter: 'blur(10px)',
          borderRadius: '20px', 
          boxShadow: '0 20px 60px rgba(0,0,0,0.12)',
          border: '1px solid rgba(255,255,255,0.5)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '28px', borderBottom: '1px solid #f1f5f9' }}>
            <h3 style={{ fontSize: '20px', fontWeight: '700', color: '#1a202c' }}>Recent Permits</h3>
          </div>
          <div>
            {permits.map((permit, index) => (
              <div key={index} style={{
                padding: '24px 28px',
                borderBottom: index < permits.length - 1 ? '1px solid #f1f5f9' : 'none',
                transition: 'all 0.3s ease',
                cursor: 'pointer'
              }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = '#f8fafc';
                e.currentTarget.style.transform = 'translateX(4px)';
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = 'transparent';
                e.currentTarget.style.transform = 'translateX(0)';
              }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '10px' }}>
                      <div style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: riskColors[permit.risk],
                        boxShadow: `0 0 8px ${riskColors[permit.risk]}`
                      }} />
                      <span style={{ fontWeight: '700', fontSize: '16px', color: '#1a202c' }}>
                        {permit.number}
                      </span>
                      <span style={{
                        padding: '6px 14px',
                        borderRadius: '20px',
                        fontSize: '12px',
                        fontWeight: '600',
                        background: statusColors[permit.status].bg,
                        color: statusColors[permit.status].text,
                        border: `1px solid ${statusColors[permit.status].dot}30`
                      }}>
                        <span style={{ 
                          display: 'inline-block',
                          width: '6px',
                          height: '6px',
                          borderRadius: '50%',
                          background: statusColors[permit.status].dot,
                          marginRight: '6px'
                        }} />
                        {permit.status}
                      </span>
                    </div>
                    <div style={{ 
                      fontSize: '14px', 
                      color: '#64748b', 
                      display: 'flex', 
                      gap: '16px',
                      flexWrap: 'wrap',
                      fontWeight: '500'
                    }}>
                      <span>🏷️ {permit.type}</span>
                      <span>📍 {permit.location}</span>
                      <span>👷 {permit.contractor}</span>
                      <span>⏱️ {permit.time}</span>
                    </div>
                  </div>
                  <button style={{
                    padding: '10px 20px',
                    background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                    color: 'white',
                    border: 'none',
                    borderRadius: '10px',
                    cursor: 'pointer',
                    fontSize: '14px',
                    fontWeight: '600',
                    transition: 'all 0.3s ease',
                    boxShadow: '0 4px 15px rgba(102, 126, 234, 0.3)'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.transform = 'scale(1.05)';
                    e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.4)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.transform = 'scale(1)';
                    e.currentTarget.style.boxShadow = '0 4px 15px rgba(102, 126, 234, 0.3)';
                  }}
                  >
                    View Details →
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
