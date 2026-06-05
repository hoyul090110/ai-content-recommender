"""
Streamlit 프론트엔드 애플리케이션
- 사용자 인증 (로그인/회원가입)
- 콘텐츠 추천 페이지
- 간단한 UI
"""
import streamlit as st
import pandas as pd
from datetime import datetime

# 페이지 설정
st.set_page_config(
    page_title="AI 콘텐츠 추천",
    page_icon="🎬",
    layout="wide"
)

# 제목
st.title("🎬 AI 콘텐츠 추천 시스템")
st.markdown("협업 필터링 + 콘텐츠 기반 필터링")

# 세션 상태 초기화
if 'user' not in st.session_state:
    st.session_state.user = None
if 'token' not in st.session_state:
    st.session_state.token = None

# ===== 사이드바 =====
with st.sidebar:
    st.header("🔐 계정")
    
    if st.session_state.user is None:
        st.write("로그인되지 않았습니다")
        
        # 로그인/회원가입 탭
        tab1, tab2 = st.tabs(["로그인", "회원가입"])
        
        with tab1:
            st.subheader("로그인")
            username = st.text_input("사용자명")
            password = st.text_input("비밀번호", type="password")
            
            if st.button("🔓 로그인"):
                if username and password:
                    # TODO: API 호출 구현
                    st.success(f"로그인 성공!")
                    st.session_state.user = {"username": username}
                else:
                    st.warning("사용자명과 비밀번호를 입력하세요")
        
        with tab2:
            st.subheader("회원가입")
            new_username = st.text_input("새 사용자명")
            new_email = st.text_input("이메일")
            new_password = st.text_input("새 비밀번호", type="password")
            
            if st.button("✅ 회원가입"):
                if new_username and new_email and new_password:
                    # TODO: API 호출 구현
                    st.success("회원가입 성공!")
                else:
                    st.warning("모든 필드를 입력하세요")
    else:
        # 로그인된 사용자
        st.success(f"👋 {st.session_state.user['username']} 님")
        if st.button("🚪 로그아웃"):
            st.session_state.user = None
            st.rerun()
    
    st.divider()
    
    # 메뉴
    st.header("📚 메뉴")
    page = st.radio(
        "페이지 선택",
        ["🎯 추천", "🔥 인기", "📊 통계"]
    )

# ===== 메인 콘텐츠 =====
if page == "🎯 추천":
    st.header("🎯 나를 위한 추천")
    
    if st.session_state.user is None:
        st.warning("⚠️ 로그인 후 이용 가능합니다")
    else:
        # 추천 개수 슬라이더
        limit = st.slider("추천 개수", 5, 20, 10)
        
        if st.button("🔄 추천 받기"):
            st.info("💡 추천 콘텐츠를 불러오는 중입니다...")
            # TODO: API에서 추천 데이터 로드
        
        # 샘플 데이터 표시
        sample_data = {
            "콘텐츠명": ["영화1", "영화2", "영화3"],
            "카테고리": ["액션", "드라마", "코미디"],
            "추천점수": [0.95, 0.87, 0.82]
        }
        st.dataframe(sample_data)

elif page == "🔥 인기":
    st.header("🔥 지금 인기있는 콘텐츠")
    
    # 기간 선택
    days = st.slider("기간 (일)", 1, 30, 7)
    
    if st.button("🔄 새로고침"):
        st.info("💡 인기 콘텐츠를 불러오는 중입니다...")
        # TODO: API에서 인기 콘텐츠 로드
    
    # 샘플 데이터
    trending_data = {
        "순위": [1, 2, 3],
        "콘텐츠": ["인기1", "인기2", "인기3"],
        "조회수": [1000, 850, 720]
    }
    st.dataframe(trending_data)

elif page == "📊 통계":
    st.header("📊 내 통계")
    
    if st.session_state.user is None:
        st.warning("⚠️ 로그인 후 이용 가능합니다")
    else:
        # 사용자 통계
        col1, col2, col3 = st.columns(3)
        
        with col1:
            st.metric("조회수", 0)
        with col2:
            st.metric("좋아요", 0)
        with col3:
            st.metric("북마크", 0)
        
        st.divider()
        st.write("최근 활동:")
        # TODO: 활동 이력 표시

# 푸터
st.divider()
st.markdown("""
    <div style="text-align: center; color: gray; font-size: 12px; margin-top: 2rem;">
        © 2026 AI Content Recommender System
    </div>
""", unsafe_allow_html=True)
