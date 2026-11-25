--
-- PostgreSQL database dump
--

\restrict ubrnzZNkpGAXOYi1fPZTRYeXLGtNUJeGuzX9hWd0rEtsPemVLOsg8m6z2mWNwQE

-- Dumped from database version 16.15
-- Dumped by pg_dump version 16.15

SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;

SET default_tablespace = '';

SET default_table_access_method = heap;

--
-- Name: productos; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.productos (
    id integer NOT NULL,
    nombre character varying(200) NOT NULL,
    categoria character varying(100) NOT NULL,
    precio_compra numeric(10,2) NOT NULL,
    precio_venta numeric(10,2) NOT NULL,
    stock_actual integer NOT NULL,
    stock_minimo integer NOT NULL,
    dias_alerta_vencimiento integer NOT NULL,
    fecha_caducidad date,
    ubicacion character varying(100),
    proveedor_id integer,
    activo boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    updated_at timestamp with time zone,
    codigo_barra character varying(50)
);


--
-- Name: productos_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.productos_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: productos_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.productos_id_seq OWNED BY public.productos.id;


--
-- Name: proveedores; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.proveedores (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    rut character varying(20),
    contacto character varying(150),
    email character varying(150),
    telefono character varying(30),
    activo boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now()
);


--
-- Name: proveedores_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.proveedores_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: proveedores_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.proveedores_id_seq OWNED BY public.proveedores.id;


--
-- Name: usuarios; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.usuarios (
    id integer NOT NULL,
    nombre character varying(150) NOT NULL,
    email character varying(150) NOT NULL,
    password_hash character varying(255) NOT NULL,
    activo boolean NOT NULL,
    reset_token character varying(255),
    reset_token_expira timestamp with time zone,
    created_at timestamp with time zone DEFAULT now(),
    foto_perfil text
);


--
-- Name: usuarios_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.usuarios_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: usuarios_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.usuarios_id_seq OWNED BY public.usuarios.id;


--
-- Name: ventas; Type: TABLE; Schema: public; Owner: -
--

CREATE TABLE public.ventas (
    id integer NOT NULL,
    producto_id integer NOT NULL,
    cantidad integer NOT NULL,
    precio_unitario numeric(10,2) NOT NULL,
    total numeric(10,2) NOT NULL,
    fecha timestamp with time zone NOT NULL,
    metodo_pago character varying(30),
    origen character varying(10) NOT NULL,
    anulada boolean NOT NULL,
    created_at timestamp with time zone DEFAULT now(),
    folio character varying(20)
);


--
-- Name: ventas_id_seq; Type: SEQUENCE; Schema: public; Owner: -
--

CREATE SEQUENCE public.ventas_id_seq
    AS integer
    START WITH 1
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;


--
-- Name: ventas_id_seq; Type: SEQUENCE OWNED BY; Schema: public; Owner: -
--

ALTER SEQUENCE public.ventas_id_seq OWNED BY public.ventas.id;


--
-- Name: productos id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos ALTER COLUMN id SET DEFAULT nextval('public.productos_id_seq'::regclass);


--
-- Name: proveedores id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores ALTER COLUMN id SET DEFAULT nextval('public.proveedores_id_seq'::regclass);


--
-- Name: usuarios id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios ALTER COLUMN id SET DEFAULT nextval('public.usuarios_id_seq'::regclass);


--
-- Name: ventas id; Type: DEFAULT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas ALTER COLUMN id SET DEFAULT nextval('public.ventas_id_seq'::regclass);


--
-- Name: productos productos_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_pkey PRIMARY KEY (id);


--
-- Name: proveedores proveedores_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.proveedores
    ADD CONSTRAINT proveedores_pkey PRIMARY KEY (id);


--
-- Name: usuarios usuarios_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.usuarios
    ADD CONSTRAINT usuarios_pkey PRIMARY KEY (id);


--
-- Name: ventas ventas_pkey; Type: CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_pkey PRIMARY KEY (id);


--
-- Name: ix_productos_categoria; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_productos_categoria ON public.productos USING btree (categoria);


--
-- Name: ix_productos_codigo_barra; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_productos_codigo_barra ON public.productos USING btree (codigo_barra);


--
-- Name: ix_productos_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_productos_id ON public.productos USING btree (id);


--
-- Name: ix_productos_nombre; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_productos_nombre ON public.productos USING btree (nombre);


--
-- Name: ix_proveedores_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_proveedores_id ON public.proveedores USING btree (id);


--
-- Name: ix_usuarios_email; Type: INDEX; Schema: public; Owner: -
--

CREATE UNIQUE INDEX ix_usuarios_email ON public.usuarios USING btree (email);


--
-- Name: ix_usuarios_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_usuarios_id ON public.usuarios USING btree (id);


--
-- Name: ix_ventas_fecha; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ventas_fecha ON public.ventas USING btree (fecha);


--
-- Name: ix_ventas_folio; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ventas_folio ON public.ventas USING btree (folio);


--
-- Name: ix_ventas_id; Type: INDEX; Schema: public; Owner: -
--

CREATE INDEX ix_ventas_id ON public.ventas USING btree (id);


--
-- Name: productos productos_proveedor_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.productos
    ADD CONSTRAINT productos_proveedor_id_fkey FOREIGN KEY (proveedor_id) REFERENCES public.proveedores(id);


--
-- Name: ventas ventas_producto_id_fkey; Type: FK CONSTRAINT; Schema: public; Owner: -
--

ALTER TABLE ONLY public.ventas
    ADD CONSTRAINT ventas_producto_id_fkey FOREIGN KEY (producto_id) REFERENCES public.productos(id);


--
-- PostgreSQL database dump complete
--

\unrestrict ubrnzZNkpGAXOYi1fPZTRYeXLGtNUJeGuzX9hWd0rEtsPemVLOsg8m6z2mWNwQE

