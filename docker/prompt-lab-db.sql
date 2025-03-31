--
-- PostgreSQL database dump
--

-- Dumped from database version 17.4
-- Dumped by pg_dump version 17.4

-- Started on 2025-03-31 23:49:41

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET transaction_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

--
-- TOC entry 2 (class 3079 OID 17044)
-- Name: uuid-ossp; Type: EXTENSION; Schema: -; Owner: -
--

CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;


--
-- TOC entry 5141 (class 0 OID 0)
-- Dependencies: 2
-- Name: EXTENSION "uuid-ossp"; Type: COMMENT; Schema: -; Owner: 
--

COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';


SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- TOC entry 219 (class 1259 OID 17064)
-- Name: accounts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    bio text,
    profile_image_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.accounts OWNER TO postgres;

--
-- TOC entry 233 (class 1259 OID 17327)
-- Name: badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    icon_image_id uuid,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.badges OWNER TO postgres;

--
-- TOC entry 228 (class 1259 OID 17241)
-- Name: follows; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.follows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    follower_id uuid NOT NULL,
    followee_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.follows OWNER TO postgres;

--
-- TOC entry 226 (class 1259 OID 17205)
-- Name: forks; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.forks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_repo_id uuid NOT NULL,
    forked_repo_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.forks OWNER TO postgres;

--
-- TOC entry 218 (class 1259 OID 17055)
-- Name: images; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data bytea NOT NULL,
    mime_type text,
    alt_text text,
    source_url text,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.images OWNER TO postgres;

--
-- TOC entry 239 (class 1259 OID 17441)
-- Name: merge_request_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merge_request_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    merge_request_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.merge_request_comments OWNER TO postgres;

--
-- TOC entry 238 (class 1259 OID 17420)
-- Name: merge_request_reviews; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merge_request_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    merge_request_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    approved boolean,
    comment text,
    reviewed_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.merge_request_reviews OWNER TO postgres;

--
-- TOC entry 237 (class 1259 OID 17389)
-- Name: merge_requests; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.merge_requests (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    source_version_id uuid NOT NULL,
    target_version_id uuid,
    author_id uuid NOT NULL,
    status text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    merged_at timestamp with time zone,
    auto_merged boolean DEFAULT false,
    CONSTRAINT merge_requests_status_check CHECK ((status = ANY (ARRAY['open'::text, 'merged'::text, 'rejected'::text])))
);


ALTER TABLE public.merge_requests OWNER TO postgres;

--
-- TOC entry 232 (class 1259 OID 17311)
-- Name: notifications; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_id uuid NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.notifications OWNER TO postgres;

--
-- TOC entry 221 (class 1259 OID 17106)
-- Name: org_memberships; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.org_memberships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.org_memberships OWNER TO postgres;

--
-- TOC entry 220 (class 1259 OID 17084)
-- Name: organizations; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.organizations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    logo_image_id uuid,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.organizations OWNER TO postgres;

--
-- TOC entry 231 (class 1259 OID 17291)
-- Name: prompt_comments; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prompt_comments OWNER TO postgres;

--
-- TOC entry 236 (class 1259 OID 17364)
-- Name: prompt_runs; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_runs (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    version_id uuid,
    user_id uuid,
    model text NOT NULL,
    input_variables jsonb NOT NULL,
    rendered_prompt text,
    output text,
    success boolean DEFAULT true,
    error_message text,
    metadata jsonb,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prompt_runs OWNER TO postgres;

--
-- TOC entry 230 (class 1259 OID 17272)
-- Name: prompt_tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prompt_tags OWNER TO postgres;

--
-- TOC entry 225 (class 1259 OID 17186)
-- Name: prompt_versions; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompt_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    content_snapshot text NOT NULL,
    diff_snapshot text,
    commit_message text,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    version_number integer NOT NULL
);


ALTER TABLE public.prompt_versions OWNER TO postgres;

--
-- TOC entry 235 (class 1259 OID 17363)
-- Name: prompt_versions_version_number_seq; Type: SEQUENCE; Schema: public; Owner: postgres
--

ALTER TABLE public.prompt_versions ALTER COLUMN version_number ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prompt_versions_version_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);


--
-- TOC entry 224 (class 1259 OID 17171)
-- Name: prompts; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.prompts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    repo_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    content text NOT NULL,
    metadata_json jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.prompts OWNER TO postgres;

--
-- TOC entry 223 (class 1259 OID 17149)
-- Name: repo_collaborators; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repo_collaborators (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    repo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.repo_collaborators OWNER TO postgres;

--
-- TOC entry 222 (class 1259 OID 17128)
-- Name: repositories; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.repositories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    owner_user_id uuid,
    owner_org_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.repositories OWNER TO postgres;

--
-- TOC entry 227 (class 1259 OID 17222)
-- Name: stars; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.stars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    repo_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.stars OWNER TO postgres;

--
-- TOC entry 229 (class 1259 OID 17260)
-- Name: tags; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.tags OWNER TO postgres;

--
-- TOC entry 234 (class 1259 OID 17341)
-- Name: user_badges; Type: TABLE; Schema: public; Owner: postgres
--

CREATE TABLE public.user_badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now()
);


ALTER TABLE public.user_badges OWNER TO postgres;

--
-- TOC entry 4893 (class 2606 OID 17078)
-- Name: accounts accounts_email_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);


--
-- TOC entry 4895 (class 2606 OID 17074)
-- Name: accounts accounts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);


--
-- TOC entry 4897 (class 2606 OID 17076)
-- Name: accounts accounts_username_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);


--
-- TOC entry 4939 (class 2606 OID 17335)
-- Name: badges badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);


--
-- TOC entry 4923 (class 2606 OID 17249)
-- Name: follows follows_follower_id_followee_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_followee_id_key UNIQUE (follower_id, followee_id);


--
-- TOC entry 4925 (class 2606 OID 17247)
-- Name: follows follows_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);


--
-- TOC entry 4917 (class 2606 OID 17211)
-- Name: forks forks_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_pkey PRIMARY KEY (id);


--
-- TOC entry 4891 (class 2606 OID 17063)
-- Name: images images_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);


--
-- TOC entry 4953 (class 2606 OID 17449)
-- Name: merge_request_comments merge_request_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4949 (class 2606 OID 17430)
-- Name: merge_request_reviews merge_request_reviews_merge_request_id_reviewer_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_merge_request_id_reviewer_id_key UNIQUE (merge_request_id, reviewer_id);


--
-- TOC entry 4951 (class 2606 OID 17428)
-- Name: merge_request_reviews merge_request_reviews_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_pkey PRIMARY KEY (id);


--
-- TOC entry 4947 (class 2606 OID 17399)
-- Name: merge_requests merge_requests_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_pkey PRIMARY KEY (id);


--
-- TOC entry 4937 (class 2606 OID 17321)
-- Name: notifications notifications_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);


--
-- TOC entry 4903 (class 2606 OID 17117)
-- Name: org_memberships org_memberships_org_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_org_id_user_id_key UNIQUE (org_id, user_id);


--
-- TOC entry 4905 (class 2606 OID 17115)
-- Name: org_memberships org_memberships_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_pkey PRIMARY KEY (id);


--
-- TOC entry 4899 (class 2606 OID 17095)
-- Name: organizations organizations_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);


--
-- TOC entry 4901 (class 2606 OID 17093)
-- Name: organizations organizations_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);


--
-- TOC entry 4935 (class 2606 OID 17300)
-- Name: prompt_comments prompt_comments_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_pkey PRIMARY KEY (id);


--
-- TOC entry 4945 (class 2606 OID 17373)
-- Name: prompt_runs prompt_runs_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_pkey PRIMARY KEY (id);


--
-- TOC entry 4931 (class 2606 OID 17278)
-- Name: prompt_tags prompt_tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_pkey PRIMARY KEY (id);


--
-- TOC entry 4933 (class 2606 OID 17280)
-- Name: prompt_tags prompt_tags_prompt_id_tag_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_prompt_id_tag_id_key UNIQUE (prompt_id, tag_id);


--
-- TOC entry 4915 (class 2606 OID 17194)
-- Name: prompt_versions prompt_versions_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_pkey PRIMARY KEY (id);


--
-- TOC entry 4913 (class 2606 OID 17180)
-- Name: prompts prompts_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);


--
-- TOC entry 4909 (class 2606 OID 17158)
-- Name: repo_collaborators repo_collaborators_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_pkey PRIMARY KEY (id);


--
-- TOC entry 4911 (class 2606 OID 17160)
-- Name: repo_collaborators repo_collaborators_repo_id_user_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_repo_id_user_id_key UNIQUE (repo_id, user_id);


--
-- TOC entry 4907 (class 2606 OID 17138)
-- Name: repositories repositories_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_pkey PRIMARY KEY (id);


--
-- TOC entry 4919 (class 2606 OID 17228)
-- Name: stars stars_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_pkey PRIMARY KEY (id);


--
-- TOC entry 4921 (class 2606 OID 17230)
-- Name: stars stars_user_id_repo_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_user_id_repo_id_key UNIQUE (user_id, repo_id);


--
-- TOC entry 4927 (class 2606 OID 17271)
-- Name: tags tags_name_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);


--
-- TOC entry 4929 (class 2606 OID 17269)
-- Name: tags tags_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);


--
-- TOC entry 4941 (class 2606 OID 17347)
-- Name: user_badges user_badges_pkey; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);


--
-- TOC entry 4943 (class 2606 OID 17349)
-- Name: user_badges user_badges_user_id_badge_id_key; Type: CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);


--
-- TOC entry 4954 (class 2606 OID 17079)
-- Name: accounts accounts_profile_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_profile_image_id_fkey FOREIGN KEY (profile_image_id) REFERENCES public.images(id);


--
-- TOC entry 4977 (class 2606 OID 17336)
-- Name: badges badges_icon_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_icon_image_id_fkey FOREIGN KEY (icon_image_id) REFERENCES public.images(id);


--
-- TOC entry 4970 (class 2606 OID 17255)
-- Name: follows follows_followee_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_followee_id_fkey FOREIGN KEY (followee_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 4971 (class 2606 OID 17250)
-- Name: follows follows_follower_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 4966 (class 2606 OID 17217)
-- Name: forks forks_forked_repo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_forked_repo_id_fkey FOREIGN KEY (forked_repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;


--
-- TOC entry 4967 (class 2606 OID 17212)
-- Name: forks forks_source_repo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_source_repo_id_fkey FOREIGN KEY (source_repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;


--
-- TOC entry 4989 (class 2606 OID 17455)
-- Name: merge_request_comments merge_request_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);


--
-- TOC entry 4990 (class 2606 OID 17450)
-- Name: merge_request_comments merge_request_comments_merge_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_merge_request_id_fkey FOREIGN KEY (merge_request_id) REFERENCES public.merge_requests(id) ON DELETE CASCADE;


--
-- TOC entry 4987 (class 2606 OID 17431)
-- Name: merge_request_reviews merge_request_reviews_merge_request_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_merge_request_id_fkey FOREIGN KEY (merge_request_id) REFERENCES public.merge_requests(id) ON DELETE CASCADE;


--
-- TOC entry 4988 (class 2606 OID 17436)
-- Name: merge_request_reviews merge_request_reviews_reviewer_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.accounts(id);


--
-- TOC entry 4983 (class 2606 OID 17415)
-- Name: merge_requests merge_requests_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);


--
-- TOC entry 4984 (class 2606 OID 17400)
-- Name: merge_requests merge_requests_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- TOC entry 4985 (class 2606 OID 17405)
-- Name: merge_requests merge_requests_source_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_source_version_id_fkey FOREIGN KEY (source_version_id) REFERENCES public.prompt_versions(id);


--
-- TOC entry 4986 (class 2606 OID 17410)
-- Name: merge_requests merge_requests_target_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_target_version_id_fkey FOREIGN KEY (target_version_id) REFERENCES public.prompt_versions(id);


--
-- TOC entry 4976 (class 2606 OID 17322)
-- Name: notifications notifications_recipient_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.accounts(id);


--
-- TOC entry 4957 (class 2606 OID 17118)
-- Name: org_memberships org_memberships_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;


--
-- TOC entry 4958 (class 2606 OID 17123)
-- Name: org_memberships org_memberships_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 4955 (class 2606 OID 17096)
-- Name: organizations organizations_logo_image_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_logo_image_id_fkey FOREIGN KEY (logo_image_id) REFERENCES public.images(id);


--
-- TOC entry 4956 (class 2606 OID 17101)
-- Name: organizations organizations_owner_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.accounts(id);


--
-- TOC entry 4974 (class 2606 OID 17306)
-- Name: prompt_comments prompt_comments_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);


--
-- TOC entry 4975 (class 2606 OID 17301)
-- Name: prompt_comments prompt_comments_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- TOC entry 4980 (class 2606 OID 17374)
-- Name: prompt_runs prompt_runs_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- TOC entry 4981 (class 2606 OID 17384)
-- Name: prompt_runs prompt_runs_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE SET NULL;


--
-- TOC entry 4982 (class 2606 OID 17379)
-- Name: prompt_runs prompt_runs_version_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.prompt_versions(id) ON DELETE SET NULL;


--
-- TOC entry 4972 (class 2606 OID 17281)
-- Name: prompt_tags prompt_tags_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- TOC entry 4973 (class 2606 OID 17286)
-- Name: prompt_tags prompt_tags_tag_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);


--
-- TOC entry 4964 (class 2606 OID 17200)
-- Name: prompt_versions prompt_versions_author_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);


--
-- TOC entry 4965 (class 2606 OID 17195)
-- Name: prompt_versions prompt_versions_prompt_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;


--
-- TOC entry 4963 (class 2606 OID 17181)
-- Name: prompts prompts_repo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;


--
-- TOC entry 4961 (class 2606 OID 17161)
-- Name: repo_collaborators repo_collaborators_repo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;


--
-- TOC entry 4962 (class 2606 OID 17166)
-- Name: repo_collaborators repo_collaborators_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 4959 (class 2606 OID 17144)
-- Name: repositories repositories_owner_org_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_owner_org_id_fkey FOREIGN KEY (owner_org_id) REFERENCES public.organizations(id);


--
-- TOC entry 4960 (class 2606 OID 17139)
-- Name: repositories repositories_owner_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.accounts(id);


--
-- TOC entry 4968 (class 2606 OID 17236)
-- Name: stars stars_repo_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;


--
-- TOC entry 4969 (class 2606 OID 17231)
-- Name: stars stars_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;


--
-- TOC entry 4978 (class 2606 OID 17355)
-- Name: user_badges user_badges_badge_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);


--
-- TOC entry 4979 (class 2606 OID 17350)
-- Name: user_badges user_badges_user_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: postgres
--

ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id);


-- Completed on 2025-03-31 23:49:41

--
-- PostgreSQL database dump complete
--

