#!/usr/bin/env bash
# UserPromptSubmit 훅: 매 프롬프트마다 TDD 규율 리마인더를 컨텍스트에 주입.
# 훅은 Skill 도구를 직접 호출하지 못하므로, 구현 작업일 때 모델이
# superpowers:test-driven-development 를 먼저 invoke하도록 지시 텍스트를 넣는다.
cat <<'JSON'
{"hookSpecificOutput":{"hookEventName":"UserPromptSubmit","additionalContext":"작업 규율(TDD): 이번 요청이 기능 추가·버그 수정·코드 작성/수정 등 '구현' 작업이라면, 구현 코드를 쓰기 전에 반드시 Skill 도구로 superpowers:test-driven-development 를 먼저 invoke하여 red→green→refactor 사이클을 따른다. 질문·설명·문서·설정 변경 등 비구현 작업에는 적용하지 않는다."}}
JSON
