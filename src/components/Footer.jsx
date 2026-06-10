import React from 'react';

export default function Footer() {
  return (
    <footer style={{
      background: '#06070d',
      borderTop: '1px solid rgba(255,255,255,0.08)',
      padding: '40px 40px 20px 40px',
      color: '#888888',
      fontSize: '13px',
      fontFamily: 'system-ui, sans-serif'
    }}>
      
      {/* Top row: Logos and Socials */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '30px',
        paddingBottom: '30px',
        borderBottom: '1px solid rgba(255,255,255,0.05)'
      }}>
        
        {/* Certification Badges */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center', flexWrap: 'wrap' }}>
          
          {/* Panacea */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.02)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ width: '8px', height: '8px', background: '#00f2fe', borderRadius: '50%' }} />
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>
              PCI DSS CERTIFIED
            </span>
          </div>

          {/* Norton */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(255,255,255,0.02)',
            padding: '6px 12px',
            borderRadius: '4px',
            border: '1px solid rgba(255,255,255,0.06)'
          }}>
            <div style={{ width: '8px', height: '8px', background: '#ffcc00', borderRadius: '50%' }} />
            <span style={{ fontSize: '10px', fontWeight: 'bold', color: 'white', letterSpacing: '0.5px' }}>
              NORTON SECURED
            </span>
          </div>

        </div>

        {/* Social Links */}
        <div style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
          <a href="#facebook" onClick={(e) => e.preventDefault()} style={socialIconStyle} title="Facebook">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
          </a>
          <a href="#instagram" onClick={(e) => e.preventDefault()} style={socialIconStyle} title="Instagram">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
          </a>
          <a href="#youtube" onClick={(e) => e.preventDefault()} style={socialIconStyle} title="YouTube">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M2.5 17a24.12 24.12 0 0 1 0-10 2 2 0 0 1 1.4-1.4 49.56 49.56 0 0 1 16.2 0A2 2 0 0 1 21.5 7a24.12 24.12 0 0 1 0 10 2 2 0 0 1-1.4 1.4 49.55 49.55 0 0 1-16.2 0A2 2 0 0 1 2.5 17z"/><path d="m10 15 5-3-5-3z"/></svg>
          </a>
          <a href="#x" onClick={(e) => e.preventDefault()} style={socialIconStyle} title="X">
            <span style={{ fontWeight: 800, fontSize: '15px' }}>X</span>
          </a>
          <a href="#linkedin" onClick={(e) => e.preventDefault()} style={socialIconStyle} title="LinkedIn">
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M16 8a6 6 0 0 1 6 6v7h-4v-7a2 2 0 0 0-2-2 2 2 0 0 0-2 2v7h-4v-7a6 6 0 0 1 6-6z"/><rect width="4" height="12" x="2" y="9"/><circle cx="4" cy="4" r="2"/></svg>
          </a>
        </div>

      </div>

      {/* Bottom row: copyright and terms */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '20px',
        paddingTop: '20px',
        fontSize: '12px'
      }}>
        
        <span>
          &copy; {new Date().getFullYear()} Showzy. All rights reserved.
        </span>

        <div style={{ display: 'flex', gap: '20px' }}>
          <a href="#privacy" onClick={(e) => { e.preventDefault(); alert("Secure ticket scheduling policy verified."); }} style={{ color: '#888888', textDecoration: 'none' }}>Privacy Policy</a>
          <a href="#terms" onClick={(e) => { e.preventDefault(); alert("Seat matrices transaction terms verified."); }} style={{ color: '#888888', textDecoration: 'none' }}>Terms & Conditions</a>
        </div>

      </div>

    </footer>
  );
}

const socialIconStyle = {
  color: '#b3b3b3',
  transition: 'color 0.2s ease',
  textDecoration: 'none',
  display: 'inline-flex',
  alignItems: 'center',
  justifyContent: 'center'
};
