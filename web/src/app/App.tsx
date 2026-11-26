import { useEffect, useRef } from 'react';
import { Link, NavLink, Navigate, Route, Routes, matchPath, useLocation } from 'react-router';
import { AiConnectionPanel } from '../features/ai/AiConnectionPanel';
import { AiotPage } from '../features/aiot/AiotPage';
import { BulletinPage } from '../features/bulletins/BulletinPage';
import { NewsArchivePage } from '../features/bulletins/NewsArchivePage';
import { OpportunityActivityChart } from '../features/bulletins/OpportunityActivityChart';
import { FarmModelsPage } from '../features/farming/FarmModelsPage';
import { LibraryPage } from '../features/library/LibraryPage';
import { SideJobsPage } from '../features/rankings/SideJobsPage';
import { ServiceProfilesPage } from '../features/services/ServiceProfilesPage';
import { LibrarySourceChart } from '../features/sources/LibrarySourceChart';
import { SourcesPage } from '../features/sources/SourcesPage';

const sections = [
  {
    path: '/',
    title: 'Bản tin sáng',
    content: <BulletinPage />,
  },
  {
    path: '/kho-tin',
    title: 'Kho tin',
    content: <NewsArchivePage />,
  },
  {
    path: '/cong-viec-phu',
    title: 'Công việc phụ',
    content: <SideJobsPage futureActivity={<OpportunityActivityChart />} />,
  },
  {
    path: '/nghe-dich-vu',
    title: 'Nghề dịch vụ',
    content: <ServiceProfilesPage />,
  },
  {
    path: '/aiot-chatbot',
    title: 'AIoT & Chatbot',
    content: <AiotPage />,
  },
  {
    path: '/nong-nghiep',
    title: 'Nông nghiệp ở quê',
    content: <FarmModelsPage />,
  },
  {
    path: '/thu-vien',
    title: 'Thư viện',
    content: <>
      <LibraryPage />
      <details className="panel library-sources">
        <summary>Nguồn RSS/Atom đã đăng ký</summary>
        <LibrarySourceChart />
      </details>
    </>,
  },
] as const;

export function App() {
  const { pathname, hash } = useLocation();
  const main = useRef<HTMLElement>(null);
  const previousPath = useRef(pathname);

  useEffect(() => {
    const section = sections.find(({ path }) => matchPath(path, pathname));
    const title = section?.title ?? (matchPath('/quan-tri', pathname) ? 'Quản trị' : 'Không tìm thấy trang');
    document.title = `${title} · Radar`;
    if (previousPath.current === pathname) return;

    previousPath.current = pathname;
    window.scrollTo(0, 0);
    main.current?.focus({ preventScroll: true });
  }, [pathname]);

  return (
    <div className="app-layout">
      <a className="skip-link" href="#noi-dung">Đến nội dung chính</a>
      <header className="sidebar">
        <Link className="wordmark" to="/">Radar</Link>
        <nav aria-label="Menu Radar">
          {sections.map((section) => (
            <NavLink key={section.path} to={section.path} end>{section.title}</NavLink>
          ))}
          <NavLink to="/quan-tri">Quản trị</NavLink>
        </nav>
      </header>
      <main className="page" id="noi-dung" ref={main} tabIndex={-1}>
        <Routes>
          {sections.map((section) => (
            <Route key={section.path} path={section.path} element={(
              <>
                <h1>{section.title}</h1>
                {section.content}
              </>
            )} />
          ))}
          <Route path="/xep-hang" element={<Navigate to={{ pathname: '/cong-viec-phu', search: '?muc=tuong-lai', hash }} replace />} />
          <Route path="/quan-tri" element={<><h1>Quản trị</h1><SourcesPage /><AiConnectionPanel /></>} />
          <Route path="*" element={<><h1>Không tìm thấy trang</h1><Link to="/">Về Bản tin sáng</Link></>} />
        </Routes>
      </main>
    </div>
  );
}
