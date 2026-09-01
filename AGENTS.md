<!-- SPECKIT START -->
For additional context about technologies to be used, project structure,
shell commands, and other important information, read the current plan at:
specs/002-chat-session-summary/plan.md
<!-- SPECKIT END -->

# Investigation & Debugging Guidelines

When you are asked to investigate system behavior, troubleshoot connections, test LLM prompt configurations, or check embedding distance/retrieval status, **DO NOT create new ad-hoc scripts under `apps/api`**.

Follow these instructions instead:
1. **Check Environment Variables**: Inspect the environment configuration in [apps/api/.env](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/.env) to ensure it points to the correct database port, local LLM port, and embeddings server port.
2. **Review Existing Test/Investigation Tools**: Check [apps/api/test/investigation/docs/README.md](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/test/investigation/docs/README.md) for details on existing tools.
3. **RAG & Embeddings Nuances**: For details on chunking parameters, 192-dim Matryoshka slicing, inconsistent Nomic query prefixes, zero-vector (`[0,0,0...]`) fixes, or graph workflow policies, read the [RAG Knowledge System Module Documentation](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/docs/knowledge_system.md).
4. **Business Knowledge Classification**: For details on how business documents are ingested, MEDDIC sales classification, entity extraction schemas (e.g., pricing models, industry use cases), and their embedding strategies for the business workflow RAG pipeline, read the [Business Knowledge Classification Documentation](file:///Users/harmanjitsingh/Workspace/universal-onboarding-mono/apps/api/docs/business_knowledge_classification.md).