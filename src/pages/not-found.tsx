import { Home, ArrowLeft } from "lucide-react";
import { Link } from "react-router-dom";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="text-center space-y-6 p-8">
        {/* 404 숫자 */}
        <div className="space-y-2">
          <h1 className="text-9xl font-bold text-primary/20 select-none">
            404
          </h1>
          <div className="text-2xl font-semibold text-foreground">
            페이지를 찾을 수 없습니다
          </div>
          <p className="text-muted-foreground ">
            죄송합니다. 요청하신 페이지가 존재하지 않거나 이동되었을 수
            있습니다.
          </p>
        </div>

        {/* 버튼들 */}
        <div className="flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            to="/"
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2"
          >
            <Home className="mr-2 h-4 w-4" />
            홈으로 가기
          </Link>

          <button
            onClick={() => window.history.back()}
            className="inline-flex items-center justify-center rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 border border-input bg-background hover:bg-accent hover:text-accent-foreground h-10 px-4 py-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            이전으로
          </button>
        </div>

        {/* 추가 도움말 */}
        <div className="text-sm text-muted-foreground">
          <p>문제가 지속되면 관리자에게 문의해주세요.</p>
        </div>
      </div>
    </div>
  );
}
