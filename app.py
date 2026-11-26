import json
from pathlib import Path

import streamlit as st


APP_DIR = Path(__file__).resolve().parent
EVIDENCE_PATH = APP_DIR / "data" / "evidence.json"


def load_evidence() -> list[dict[str, str]]:
    with EVIDENCE_PATH.open(encoding="utf-8") as evidence_file:
        return json.load(evidence_file)


st.set_page_config(
    page_title="ENGage",
    page_icon="\u2705",
    layout="centered",
)

st.title("ENGage")
st.subheader("Eva Stone")
st.write("Project Orion \u00b7 ONB-005")
st.info("Reported status: Ready with Support")

st.header("Evidence")
for source in load_evidence():
    with st.expander(f"{source['email_id']} | {source['author_role']}"):
        st.write(f"**Source ID:** {source['email_id']}")
        st.write(f"**Role:** {source['author_role']}")
        st.write(f"**Date:** {source['date']}")
        st.write(source["original_text"])

st.header("Technical review needed")
st.markdown(
    """
**Evidence gap:** The Line Manager considers local onboarding closed. The email
does not say whether that assessment covers the two complex scenarios identified
by the Technical Lead.

**Final technical readiness:** No final confirmation is recorded in the supplied
evidence.

**Suggested next action:** Ask the Technical Lead to observe Eva performing the
two complex scenarios and record which tasks she can perform independently.
"""
)
