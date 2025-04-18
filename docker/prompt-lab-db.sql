PGDMP                      }           prompt_management_db    17.4    17.4 b               0    0    ENCODING    ENCODING        SET client_encoding = 'UTF8';
                           false                       0    0 
   STDSTRINGS 
   STDSTRINGS     (   SET standard_conforming_strings = 'on';
                           false                       0    0 
   SEARCHPATH 
   SEARCHPATH     8   SELECT pg_catalog.set_config('search_path', '', false);
                           false                       1262    17043    prompt_management_db    DATABASE     z   CREATE DATABASE prompt_management_db WITH TEMPLATE = template0 ENCODING = 'UTF8' LOCALE_PROVIDER = libc LOCALE = 'en-US';
 $   DROP DATABASE prompt_management_db;
                     postgres    false                       0    0    DATABASE prompt_management_db    COMMENT     M   COMMENT ON DATABASE prompt_management_db IS 'Prompt management platform DB';
                        postgres    false    5141                        3079    17044 	   uuid-ossp 	   EXTENSION     ?   CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA public;
    DROP EXTENSION "uuid-ossp";
                        false                       0    0    EXTENSION "uuid-ossp"    COMMENT     W   COMMENT ON EXTENSION "uuid-ossp" IS 'generate universally unique identifiers (UUIDs)';
                             false    2            �            1259    17064    accounts    TABLE     �  CREATE TABLE public.accounts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    username text NOT NULL,
    email text NOT NULL,
    password_hash text NOT NULL,
    bio text,
    profile_image_id uuid,
    is_active boolean DEFAULT true,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now(),
    full_name text NOT NULL
);
    DROP TABLE public.accounts;
       public         heap r       postgres    false    2            �            1259    17327    badges    TABLE     �   CREATE TABLE public.badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    icon_image_id uuid,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.badges;
       public         heap r       postgres    false    2            �            1259    17241    follows    TABLE     �   CREATE TABLE public.follows (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    follower_id uuid NOT NULL,
    followee_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.follows;
       public         heap r       postgres    false    2            �            1259    17205    forks    TABLE     �   CREATE TABLE public.forks (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    source_repo_id uuid NOT NULL,
    forked_repo_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.forks;
       public         heap r       postgres    false    2            �            1259    17055    images    TABLE     �   CREATE TABLE public.images (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    data bytea NOT NULL,
    mime_type text,
    alt_text text,
    source_url text,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.images;
       public         heap r       postgres    false    2            �            1259    17441    merge_request_comments    TABLE     �   CREATE TABLE public.merge_request_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    merge_request_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
 *   DROP TABLE public.merge_request_comments;
       public         heap r       postgres    false    2            �            1259    17420    merge_request_reviews    TABLE     	  CREATE TABLE public.merge_request_reviews (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    merge_request_id uuid NOT NULL,
    reviewer_id uuid NOT NULL,
    approved boolean,
    comment text,
    reviewed_at timestamp with time zone DEFAULT now()
);
 )   DROP TABLE public.merge_request_reviews;
       public         heap r       postgres    false    2            �            1259    17389    merge_requests    TABLE     �  CREATE TABLE public.merge_requests (
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
 "   DROP TABLE public.merge_requests;
       public         heap r       postgres    false    2            �            1259    17311    notifications    TABLE     Y  CREATE TABLE public.notifications (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    recipient_id uuid NOT NULL,
    type text NOT NULL,
    message text NOT NULL,
    is_read boolean DEFAULT false,
    reference_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
 !   DROP TABLE public.notifications;
       public         heap r       postgres    false    2            �            1259    17106    org_memberships    TABLE       CREATE TABLE public.org_memberships (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    org_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
 #   DROP TABLE public.org_memberships;
       public         heap r       postgres    false    2            �            1259    17084    organizations    TABLE     %  CREATE TABLE public.organizations (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    logo_image_id uuid,
    owner_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
 !   DROP TABLE public.organizations;
       public         heap r       postgres    false    2            �            1259    17291    prompt_comments    TABLE        CREATE TABLE public.prompt_comments (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    author_id uuid NOT NULL,
    body text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
 #   DROP TABLE public.prompt_comments;
       public         heap r       postgres    false    2            �            1259    17364    prompt_runs    TABLE     �  CREATE TABLE public.prompt_runs (
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
    DROP TABLE public.prompt_runs;
       public         heap r       postgres    false    2            �            1259    17272    prompt_tags    TABLE     �   CREATE TABLE public.prompt_tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    tag_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.prompt_tags;
       public         heap r       postgres    false    2            �            1259    17186    prompt_versions    TABLE     B  CREATE TABLE public.prompt_versions (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    prompt_id uuid NOT NULL,
    content_snapshot text NOT NULL,
    diff_snapshot text,
    commit_message text,
    author_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    version_number integer NOT NULL
);
 #   DROP TABLE public.prompt_versions;
       public         heap r       postgres    false    2            �            1259    17363 "   prompt_versions_version_number_seq    SEQUENCE     �   ALTER TABLE public.prompt_versions ALTER COLUMN version_number ADD GENERATED ALWAYS AS IDENTITY (
    SEQUENCE NAME public.prompt_versions_version_number_seq
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1
);
            public               postgres    false    225            �            1259    17171    prompts    TABLE     D  CREATE TABLE public.prompts (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    repo_id uuid NOT NULL,
    title text NOT NULL,
    description text,
    content text NOT NULL,
    metadata_json jsonb,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.prompts;
       public         heap r       postgres    false    2            �            1259    17149    repo_collaborators    TABLE       CREATE TABLE public.repo_collaborators (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    repo_id uuid NOT NULL,
    user_id uuid NOT NULL,
    role text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
 &   DROP TABLE public.repo_collaborators;
       public         heap r       postgres    false    2            �            1259    17128    repositories    TABLE     M  CREATE TABLE public.repositories (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    description text,
    is_public boolean DEFAULT false,
    owner_user_id uuid,
    owner_org_id uuid,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
     DROP TABLE public.repositories;
       public         heap r       postgres    false    2            �            1259    17222    stars    TABLE     �   CREATE TABLE public.stars (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    repo_id uuid NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.stars;
       public         heap r       postgres    false    2            �            1259    17260    tags    TABLE     �   CREATE TABLE public.tags (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    name text NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.tags;
       public         heap r       postgres    false    2            �            1259    17341    user_badges    TABLE     �   CREATE TABLE public.user_badges (
    id uuid DEFAULT public.uuid_generate_v4() NOT NULL,
    user_id uuid NOT NULL,
    badge_id uuid NOT NULL,
    earned_at timestamp with time zone DEFAULT now()
);
    DROP TABLE public.user_badges;
       public         heap r       postgres    false    2                       2606    17078    accounts accounts_email_key 
   CONSTRAINT     W   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_email_key UNIQUE (email);
 E   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_email_key;
       public                 postgres    false    219                       2606    17074    accounts accounts_pkey 
   CONSTRAINT     T   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_pkey PRIMARY KEY (id);
 @   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_pkey;
       public                 postgres    false    219            !           2606    17076    accounts accounts_username_key 
   CONSTRAINT     ]   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_username_key UNIQUE (username);
 H   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_username_key;
       public                 postgres    false    219            K           2606    17335    badges badges_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.badges DROP CONSTRAINT badges_pkey;
       public                 postgres    false    233            ;           2606    17249 +   follows follows_follower_id_followee_id_key 
   CONSTRAINT     z   ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_followee_id_key UNIQUE (follower_id, followee_id);
 U   ALTER TABLE ONLY public.follows DROP CONSTRAINT follows_follower_id_followee_id_key;
       public                 postgres    false    228    228            =           2606    17247    follows follows_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.follows DROP CONSTRAINT follows_pkey;
       public                 postgres    false    228            5           2606    17211    forks forks_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.forks DROP CONSTRAINT forks_pkey;
       public                 postgres    false    226                       2606    17063    images images_pkey 
   CONSTRAINT     P   ALTER TABLE ONLY public.images
    ADD CONSTRAINT images_pkey PRIMARY KEY (id);
 <   ALTER TABLE ONLY public.images DROP CONSTRAINT images_pkey;
       public                 postgres    false    218            Y           2606    17449 2   merge_request_comments merge_request_comments_pkey 
   CONSTRAINT     p   ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_pkey PRIMARY KEY (id);
 \   ALTER TABLE ONLY public.merge_request_comments DROP CONSTRAINT merge_request_comments_pkey;
       public                 postgres    false    239            U           2606    17430 L   merge_request_reviews merge_request_reviews_merge_request_id_reviewer_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_merge_request_id_reviewer_id_key UNIQUE (merge_request_id, reviewer_id);
 v   ALTER TABLE ONLY public.merge_request_reviews DROP CONSTRAINT merge_request_reviews_merge_request_id_reviewer_id_key;
       public                 postgres    false    238    238            W           2606    17428 0   merge_request_reviews merge_request_reviews_pkey 
   CONSTRAINT     n   ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_pkey PRIMARY KEY (id);
 Z   ALTER TABLE ONLY public.merge_request_reviews DROP CONSTRAINT merge_request_reviews_pkey;
       public                 postgres    false    238            S           2606    17399 "   merge_requests merge_requests_pkey 
   CONSTRAINT     `   ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_pkey PRIMARY KEY (id);
 L   ALTER TABLE ONLY public.merge_requests DROP CONSTRAINT merge_requests_pkey;
       public                 postgres    false    237            I           2606    17321     notifications notifications_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_pkey;
       public                 postgres    false    232            '           2606    17117 2   org_memberships org_memberships_org_id_user_id_key 
   CONSTRAINT     x   ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_org_id_user_id_key UNIQUE (org_id, user_id);
 \   ALTER TABLE ONLY public.org_memberships DROP CONSTRAINT org_memberships_org_id_user_id_key;
       public                 postgres    false    221    221            )           2606    17115 $   org_memberships org_memberships_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.org_memberships DROP CONSTRAINT org_memberships_pkey;
       public                 postgres    false    221            #           2606    17095 $   organizations organizations_name_key 
   CONSTRAINT     _   ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_name_key UNIQUE (name);
 N   ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_name_key;
       public                 postgres    false    220            %           2606    17093     organizations organizations_pkey 
   CONSTRAINT     ^   ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_pkey PRIMARY KEY (id);
 J   ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_pkey;
       public                 postgres    false    220            G           2606    17300 $   prompt_comments prompt_comments_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.prompt_comments DROP CONSTRAINT prompt_comments_pkey;
       public                 postgres    false    231            Q           2606    17373    prompt_runs prompt_runs_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.prompt_runs DROP CONSTRAINT prompt_runs_pkey;
       public                 postgres    false    236            C           2606    17278    prompt_tags prompt_tags_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.prompt_tags DROP CONSTRAINT prompt_tags_pkey;
       public                 postgres    false    230            E           2606    17280 ,   prompt_tags prompt_tags_prompt_id_tag_id_key 
   CONSTRAINT     t   ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_prompt_id_tag_id_key UNIQUE (prompt_id, tag_id);
 V   ALTER TABLE ONLY public.prompt_tags DROP CONSTRAINT prompt_tags_prompt_id_tag_id_key;
       public                 postgres    false    230    230            3           2606    17194 $   prompt_versions prompt_versions_pkey 
   CONSTRAINT     b   ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_pkey PRIMARY KEY (id);
 N   ALTER TABLE ONLY public.prompt_versions DROP CONSTRAINT prompt_versions_pkey;
       public                 postgres    false    225            1           2606    17180    prompts prompts_pkey 
   CONSTRAINT     R   ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_pkey PRIMARY KEY (id);
 >   ALTER TABLE ONLY public.prompts DROP CONSTRAINT prompts_pkey;
       public                 postgres    false    224            -           2606    17158 *   repo_collaborators repo_collaborators_pkey 
   CONSTRAINT     h   ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_pkey PRIMARY KEY (id);
 T   ALTER TABLE ONLY public.repo_collaborators DROP CONSTRAINT repo_collaborators_pkey;
       public                 postgres    false    223            /           2606    17160 9   repo_collaborators repo_collaborators_repo_id_user_id_key 
   CONSTRAINT     �   ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_repo_id_user_id_key UNIQUE (repo_id, user_id);
 c   ALTER TABLE ONLY public.repo_collaborators DROP CONSTRAINT repo_collaborators_repo_id_user_id_key;
       public                 postgres    false    223    223            +           2606    17138    repositories repositories_pkey 
   CONSTRAINT     \   ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_pkey PRIMARY KEY (id);
 H   ALTER TABLE ONLY public.repositories DROP CONSTRAINT repositories_pkey;
       public                 postgres    false    222            7           2606    17228    stars stars_pkey 
   CONSTRAINT     N   ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_pkey PRIMARY KEY (id);
 :   ALTER TABLE ONLY public.stars DROP CONSTRAINT stars_pkey;
       public                 postgres    false    227            9           2606    17230    stars stars_user_id_repo_id_key 
   CONSTRAINT     f   ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_user_id_repo_id_key UNIQUE (user_id, repo_id);
 I   ALTER TABLE ONLY public.stars DROP CONSTRAINT stars_user_id_repo_id_key;
       public                 postgres    false    227    227            ?           2606    17271    tags tags_name_key 
   CONSTRAINT     M   ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_name_key UNIQUE (name);
 <   ALTER TABLE ONLY public.tags DROP CONSTRAINT tags_name_key;
       public                 postgres    false    229            A           2606    17269    tags tags_pkey 
   CONSTRAINT     L   ALTER TABLE ONLY public.tags
    ADD CONSTRAINT tags_pkey PRIMARY KEY (id);
 8   ALTER TABLE ONLY public.tags DROP CONSTRAINT tags_pkey;
       public                 postgres    false    229            M           2606    17347    user_badges user_badges_pkey 
   CONSTRAINT     Z   ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_pkey PRIMARY KEY (id);
 F   ALTER TABLE ONLY public.user_badges DROP CONSTRAINT user_badges_pkey;
       public                 postgres    false    234            O           2606    17349 ,   user_badges user_badges_user_id_badge_id_key 
   CONSTRAINT     t   ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_badge_id_key UNIQUE (user_id, badge_id);
 V   ALTER TABLE ONLY public.user_badges DROP CONSTRAINT user_badges_user_id_badge_id_key;
       public                 postgres    false    234    234            Z           2606    17079 '   accounts accounts_profile_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.accounts
    ADD CONSTRAINT accounts_profile_image_id_fkey FOREIGN KEY (profile_image_id) REFERENCES public.images(id);
 Q   ALTER TABLE ONLY public.accounts DROP CONSTRAINT accounts_profile_image_id_fkey;
       public               postgres    false    218    219    4891            q           2606    17336     badges badges_icon_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.badges
    ADD CONSTRAINT badges_icon_image_id_fkey FOREIGN KEY (icon_image_id) REFERENCES public.images(id);
 J   ALTER TABLE ONLY public.badges DROP CONSTRAINT badges_icon_image_id_fkey;
       public               postgres    false    233    218    4891            j           2606    17255     follows follows_followee_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_followee_id_fkey FOREIGN KEY (followee_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.follows DROP CONSTRAINT follows_followee_id_fkey;
       public               postgres    false    228    4895    219            k           2606    17250     follows follows_follower_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.follows
    ADD CONSTRAINT follows_follower_id_fkey FOREIGN KEY (follower_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
 J   ALTER TABLE ONLY public.follows DROP CONSTRAINT follows_follower_id_fkey;
       public               postgres    false    4895    219    228            f           2606    17217    forks forks_forked_repo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_forked_repo_id_fkey FOREIGN KEY (forked_repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
 I   ALTER TABLE ONLY public.forks DROP CONSTRAINT forks_forked_repo_id_fkey;
       public               postgres    false    222    226    4907            g           2606    17212    forks forks_source_repo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.forks
    ADD CONSTRAINT forks_source_repo_id_fkey FOREIGN KEY (source_repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
 I   ALTER TABLE ONLY public.forks DROP CONSTRAINT forks_source_repo_id_fkey;
       public               postgres    false    4907    222    226            }           2606    17455 <   merge_request_comments merge_request_comments_author_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);
 f   ALTER TABLE ONLY public.merge_request_comments DROP CONSTRAINT merge_request_comments_author_id_fkey;
       public               postgres    false    239    4895    219            ~           2606    17450 C   merge_request_comments merge_request_comments_merge_request_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_request_comments
    ADD CONSTRAINT merge_request_comments_merge_request_id_fkey FOREIGN KEY (merge_request_id) REFERENCES public.merge_requests(id) ON DELETE CASCADE;
 m   ALTER TABLE ONLY public.merge_request_comments DROP CONSTRAINT merge_request_comments_merge_request_id_fkey;
       public               postgres    false    239    4947    237            {           2606    17431 A   merge_request_reviews merge_request_reviews_merge_request_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_merge_request_id_fkey FOREIGN KEY (merge_request_id) REFERENCES public.merge_requests(id) ON DELETE CASCADE;
 k   ALTER TABLE ONLY public.merge_request_reviews DROP CONSTRAINT merge_request_reviews_merge_request_id_fkey;
       public               postgres    false    238    4947    237            |           2606    17436 <   merge_request_reviews merge_request_reviews_reviewer_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_request_reviews
    ADD CONSTRAINT merge_request_reviews_reviewer_id_fkey FOREIGN KEY (reviewer_id) REFERENCES public.accounts(id);
 f   ALTER TABLE ONLY public.merge_request_reviews DROP CONSTRAINT merge_request_reviews_reviewer_id_fkey;
       public               postgres    false    238    4895    219            w           2606    17415 ,   merge_requests merge_requests_author_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);
 V   ALTER TABLE ONLY public.merge_requests DROP CONSTRAINT merge_requests_author_id_fkey;
       public               postgres    false    237    4895    219            x           2606    17400 ,   merge_requests merge_requests_prompt_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.merge_requests DROP CONSTRAINT merge_requests_prompt_id_fkey;
       public               postgres    false    237    4913    224            y           2606    17405 4   merge_requests merge_requests_source_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_source_version_id_fkey FOREIGN KEY (source_version_id) REFERENCES public.prompt_versions(id);
 ^   ALTER TABLE ONLY public.merge_requests DROP CONSTRAINT merge_requests_source_version_id_fkey;
       public               postgres    false    237    4915    225            z           2606    17410 4   merge_requests merge_requests_target_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.merge_requests
    ADD CONSTRAINT merge_requests_target_version_id_fkey FOREIGN KEY (target_version_id) REFERENCES public.prompt_versions(id);
 ^   ALTER TABLE ONLY public.merge_requests DROP CONSTRAINT merge_requests_target_version_id_fkey;
       public               postgres    false    237    4915    225            p           2606    17322 -   notifications notifications_recipient_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.notifications
    ADD CONSTRAINT notifications_recipient_id_fkey FOREIGN KEY (recipient_id) REFERENCES public.accounts(id);
 W   ALTER TABLE ONLY public.notifications DROP CONSTRAINT notifications_recipient_id_fkey;
       public               postgres    false    219    232    4895            ]           2606    17118 +   org_memberships org_memberships_org_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_org_id_fkey FOREIGN KEY (org_id) REFERENCES public.organizations(id) ON DELETE CASCADE;
 U   ALTER TABLE ONLY public.org_memberships DROP CONSTRAINT org_memberships_org_id_fkey;
       public               postgres    false    221    4901    220            ^           2606    17123 ,   org_memberships org_memberships_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.org_memberships
    ADD CONSTRAINT org_memberships_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
 V   ALTER TABLE ONLY public.org_memberships DROP CONSTRAINT org_memberships_user_id_fkey;
       public               postgres    false    221    4895    219            [           2606    17096 .   organizations organizations_logo_image_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_logo_image_id_fkey FOREIGN KEY (logo_image_id) REFERENCES public.images(id);
 X   ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_logo_image_id_fkey;
       public               postgres    false    220    218    4891            \           2606    17101 )   organizations organizations_owner_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.organizations
    ADD CONSTRAINT organizations_owner_id_fkey FOREIGN KEY (owner_id) REFERENCES public.accounts(id);
 S   ALTER TABLE ONLY public.organizations DROP CONSTRAINT organizations_owner_id_fkey;
       public               postgres    false    219    220    4895            n           2606    17306 .   prompt_comments prompt_comments_author_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);
 X   ALTER TABLE ONLY public.prompt_comments DROP CONSTRAINT prompt_comments_author_id_fkey;
       public               postgres    false    231    219    4895            o           2606    17301 .   prompt_comments prompt_comments_prompt_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_comments
    ADD CONSTRAINT prompt_comments_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.prompt_comments DROP CONSTRAINT prompt_comments_prompt_id_fkey;
       public               postgres    false    231    224    4913            t           2606    17374 &   prompt_runs prompt_runs_prompt_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.prompt_runs DROP CONSTRAINT prompt_runs_prompt_id_fkey;
       public               postgres    false    236    4913    224            u           2606    17384 $   prompt_runs prompt_runs_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE SET NULL;
 N   ALTER TABLE ONLY public.prompt_runs DROP CONSTRAINT prompt_runs_user_id_fkey;
       public               postgres    false    236    4895    219            v           2606    17379 '   prompt_runs prompt_runs_version_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_runs
    ADD CONSTRAINT prompt_runs_version_id_fkey FOREIGN KEY (version_id) REFERENCES public.prompt_versions(id) ON DELETE SET NULL;
 Q   ALTER TABLE ONLY public.prompt_runs DROP CONSTRAINT prompt_runs_version_id_fkey;
       public               postgres    false    236    4915    225            l           2606    17281 &   prompt_tags prompt_tags_prompt_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
 P   ALTER TABLE ONLY public.prompt_tags DROP CONSTRAINT prompt_tags_prompt_id_fkey;
       public               postgres    false    230    224    4913            m           2606    17286 #   prompt_tags prompt_tags_tag_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_tags
    ADD CONSTRAINT prompt_tags_tag_id_fkey FOREIGN KEY (tag_id) REFERENCES public.tags(id);
 M   ALTER TABLE ONLY public.prompt_tags DROP CONSTRAINT prompt_tags_tag_id_fkey;
       public               postgres    false    4929    229    230            d           2606    17200 .   prompt_versions prompt_versions_author_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_author_id_fkey FOREIGN KEY (author_id) REFERENCES public.accounts(id);
 X   ALTER TABLE ONLY public.prompt_versions DROP CONSTRAINT prompt_versions_author_id_fkey;
       public               postgres    false    225    4895    219            e           2606    17195 .   prompt_versions prompt_versions_prompt_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompt_versions
    ADD CONSTRAINT prompt_versions_prompt_id_fkey FOREIGN KEY (prompt_id) REFERENCES public.prompts(id) ON DELETE CASCADE;
 X   ALTER TABLE ONLY public.prompt_versions DROP CONSTRAINT prompt_versions_prompt_id_fkey;
       public               postgres    false    225    4913    224            c           2606    17181    prompts prompts_repo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.prompts
    ADD CONSTRAINT prompts_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
 F   ALTER TABLE ONLY public.prompts DROP CONSTRAINT prompts_repo_id_fkey;
       public               postgres    false    224    222    4907            a           2606    17161 2   repo_collaborators repo_collaborators_repo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.repo_collaborators DROP CONSTRAINT repo_collaborators_repo_id_fkey;
       public               postgres    false    223    4907    222            b           2606    17166 2   repo_collaborators repo_collaborators_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.repo_collaborators
    ADD CONSTRAINT repo_collaborators_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
 \   ALTER TABLE ONLY public.repo_collaborators DROP CONSTRAINT repo_collaborators_user_id_fkey;
       public               postgres    false    223    219    4895            _           2606    17144 +   repositories repositories_owner_org_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_owner_org_id_fkey FOREIGN KEY (owner_org_id) REFERENCES public.organizations(id);
 U   ALTER TABLE ONLY public.repositories DROP CONSTRAINT repositories_owner_org_id_fkey;
       public               postgres    false    222    220    4901            `           2606    17139 ,   repositories repositories_owner_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.repositories
    ADD CONSTRAINT repositories_owner_user_id_fkey FOREIGN KEY (owner_user_id) REFERENCES public.accounts(id);
 V   ALTER TABLE ONLY public.repositories DROP CONSTRAINT repositories_owner_user_id_fkey;
       public               postgres    false    222    219    4895            h           2606    17236    stars stars_repo_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_repo_id_fkey FOREIGN KEY (repo_id) REFERENCES public.repositories(id) ON DELETE CASCADE;
 B   ALTER TABLE ONLY public.stars DROP CONSTRAINT stars_repo_id_fkey;
       public               postgres    false    222    227    4907            i           2606    17231    stars stars_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.stars
    ADD CONSTRAINT stars_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id) ON DELETE CASCADE;
 B   ALTER TABLE ONLY public.stars DROP CONSTRAINT stars_user_id_fkey;
       public               postgres    false    4895    219    227            r           2606    17355 %   user_badges user_badges_badge_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_badge_id_fkey FOREIGN KEY (badge_id) REFERENCES public.badges(id);
 O   ALTER TABLE ONLY public.user_badges DROP CONSTRAINT user_badges_badge_id_fkey;
       public               postgres    false    234    4939    233            s           2606    17350 $   user_badges user_badges_user_id_fkey    FK CONSTRAINT     �   ALTER TABLE ONLY public.user_badges
    ADD CONSTRAINT user_badges_user_id_fkey FOREIGN KEY (user_id) REFERENCES public.accounts(id);
 N   ALTER TABLE ONLY public.user_badges DROP CONSTRAINT user_badges_user_id_fkey;
       public               postgres    false    234    4895    219           