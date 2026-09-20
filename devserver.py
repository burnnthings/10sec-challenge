"""개발용 정적 서버. 표준 http.server와 달리 모든 응답에 캐시 금지 헤더를 붙인다.
브라우저가 ES 모듈 스크립트를 코드 캐시에 붙잡고 새로고침/새 탭에서도 오래된 버전을
실행하는 문제(Last-Modified 기반 heuristic caching)를 막기 위함이다.
"""
import http.server
import os
import sys

# 어느 디렉터리에서 실행되든 이 스크립트가 있는 폴더(10sec-challenge/)를 서빙한다.
os.chdir(os.path.dirname(os.path.abspath(__file__)))


class NoCacheHandler(http.server.SimpleHTTPRequestHandler):
    def end_headers(self):
        self.send_header("Cache-Control", "no-store, no-cache, must-revalidate")
        self.send_header("Pragma", "no-cache")
        self.send_header("Expires", "0")
        super().end_headers()


if __name__ == "__main__":
    port = int(sys.argv[1]) if len(sys.argv) > 1 else 5500
    http.server.test(HandlerClass=NoCacheHandler, port=port)
