import { Heading, Link, Text } from "@react-email/components";

import React from "react";
import { BaseEmail, styles } from "./BaseEmail";

interface InviteEmailProps {
  url: string;
  organizationName: string;
}

export default function InviteEmail({
  url,
  organizationName,
}: InviteEmailProps) {
  return (
    <BaseEmail previewText="You have been invited to join your organization">
      <Heading style={styles.h1}>Invite to join {organizationName}</Heading>
      <Text style={styles.text}>
        You have been invited to join {organizationName} on Kestrel Path.
      </Text>
      <Text style={styles.text}>Your invitation will expire in 30 days.</Text>
      <Link
        href={url}
        target="_blank"
        style={{
          ...styles.link,
          display: "block",
          marginBottom: "16px",
        }}
      >
        Click here to join {organizationName}
      </Link>
      <Text
        style={{
          ...styles.text,
          color: "#ababab",
          marginTop: "14px",
          marginBottom: "16px",
        }}
      >
        If you didn&apos;t expect to be invited to join {organizationName}, you
        can safely ignore this email.
      </Text>
    </BaseEmail>
  );
}
