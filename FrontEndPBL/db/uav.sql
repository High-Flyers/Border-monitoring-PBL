-- phpMyAdmin SQL Dump
-- version 5.2.0
-- https://www.phpmyadmin.net/
--
-- Host: 127.0.0.1
-- Czas generowania: 26 Lis 2023, 21:07
-- Wersja serwera: 10.4.27-MariaDB
-- Wersja PHP: 8.0.25

SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";


/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8mb4 */;

--
-- Baza danych: `pbl_highflyers`
--

-- --------------------------------------------------------

--
-- Struktura tabeli dla tabeli `uav`
--

CREATE TABLE `uav` (
  `id` int(11) NOT NULL,
  `image_path` varchar(255) NOT NULL,
  `latitude` float NOT NULL,
  `longtitude` float NOT NULL,
  `date` date NOT NULL,
  `time` time NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_general_ci;

--
-- Zrzut danych tabeli `uav`
--

INSERT INTO `uav` (`id`, `image_path`, `latitude`, `longtitude`, `date`, `time`) VALUES
(1, '../public/img1.png', 50.12, 120.53, '2023-11-18', '12:34:56'),
(2, '../public/img2.png', 123, 321, '2023-11-15', '12:53:56'),
(3, '../public/hoodie_1.png', 123.54, 361.54, '2023-12-10', '10:34:42');

--
-- Indeksy dla zrzutów tabel
--

--
-- Indeksy dla tabeli `uav`
--
ALTER TABLE `uav`
  ADD PRIMARY KEY (`id`);

--
-- AUTO_INCREMENT dla zrzuconych tabel
--

--
-- AUTO_INCREMENT dla tabeli `uav`
--
ALTER TABLE `uav`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT, AUTO_INCREMENT=4;
COMMIT;

/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
