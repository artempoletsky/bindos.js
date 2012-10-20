<?php
$value = array();
for ($index = 0; $index < 100; $index++)
{
	$value[$index]=array(
		'id'=> $index,
		'amount'=>  rand(10, 1500),
	);
}

$json = json_encode($value);
echo $json;